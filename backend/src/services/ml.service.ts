import axios from "axios";
import { config } from "../config/app.config.js";
import TaskModel from "../models/task.model.js";
import ProjectModel from "../models/project.model.js";

interface PredictPriorityInput {
    title: string;
    description?: string;
    dueDate?: string;
    assignedTo?: string | null;
    workspaceId: string;
    projectId: string;
}

interface PredictPriorityResponse {
    predictedPriority: "LOW" | "MEDIUM" | "HIGH";
    confidence: number;
}

export const predictPriorityService = async (
    input: PredictPriorityInput
): Promise<PredictPriorityResponse> => {
    const { title, description, dueDate, assignedTo, workspaceId, projectId } =
        input;

    // Calculate days_until_deadline
    let daysUntilDeadline = -1; // -1 indicates no due date
    if (dueDate) {
        const due = new Date(dueDate);
        const now = new Date();
        daysUntilDeadline = Math.max(
            0,
            Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
    }

    // Calculate assignee workload (active tasks count)
    let assigneeActiveTasks = 0;
    let assigneeOverdueRate = 0;
    let assigneeAvgCompletionDelay = 0;

    if (assignedTo) {
        try {
            // Count non-DONE tasks for the assignee in this workspace
            assigneeActiveTasks = await TaskModel.countDocuments({
                assignedTo,
                workspace: workspaceId,
                status: { $ne: "DONE" },
            });

            // Calculate overdue rate
            const allAssigneeTasks = await TaskModel.find({
                assignedTo,
                workspace: workspaceId,
                dueDate: { $ne: null },
            }).select("dueDate status updatedAt createdAt");

            if (allAssigneeTasks.length > 0) {
                const now = new Date();
                let overdueCount = 0;
                let totalCompletionDelay = 0;
                let completedWithDueDate = 0;

                for (const task of allAssigneeTasks) {
                    const due = task.dueDate as Date;
                    if (task.status === "DONE") {
                        const completedAt = task.updatedAt;
                        const delayDays =
                            (completedAt.getTime() - due.getTime()) / (1000 * 60 * 60 * 24);
                        if (delayDays > 0) {
                            overdueCount++;
                            totalCompletionDelay += delayDays;
                        }
                        completedWithDueDate++;
                    } else if (now > due) {
                        overdueCount++;
                    }
                }

                assigneeOverdueRate = overdueCount / allAssigneeTasks.length;
                assigneeAvgCompletionDelay =
                    completedWithDueDate > 0
                        ? totalCompletionDelay / completedWithDueDate
                        : 0;
            }
        } catch (dbError) {
            console.warn("Could not fetch assignee stats, using defaults:", dbError);
        }
    }

    // Get project name
    let projectName = "Unknown";
    try {
        const project = await ProjectModel.findById(projectId).select("name");
        if (project) {
            projectName = project.name;
        }
    } catch {
        // Keep default
    }

    // Call the Python ML service
    const mlUrl = config.ML_SERVICE_URL || "http://localhost:8001";
    const payload = {
        title: title || "",
        description: description || "",
        days_until_deadline: daysUntilDeadline,
        assignee_active_tasks: assigneeActiveTasks,
        assignee_overdue_rate: assigneeOverdueRate,
        assignee_avg_completion_delay: assigneeAvgCompletionDelay,
        project_name: projectName,
    };

    console.log(`[ML Service] Calling ${mlUrl}/predict with payload:`, JSON.stringify(payload));

    const response = await axios.post(
        `${mlUrl}/predict`,
        payload,
        { timeout: 10000 }
    );

    console.log(`[ML Service] Response:`, JSON.stringify(response.data));

    return {
        predictedPriority: response.data.predictedPriority,
        confidence: response.data.confidence,
    };
};
