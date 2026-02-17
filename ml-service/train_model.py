"""
Train a RandomForest classifier for task priority prediction.
Reads training data from CSV, engineers features using TF-IDF,
and saves the trained model pipeline as a .pkl file.
"""
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report
import numpy as np
import os

def train_model(csv_path: str = "training_data.csv", output_path: str = "model"):
    """Train the priority prediction model from CSV data."""

    print(f"Loading training data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows")
    
    # Handle schema change from generator
    if "project_type" in df.columns:
        df.rename(columns={"project_type": "project_name"}, inplace=True)
        
    print(f"Priority distribution:\n{df['priority'].value_counts()}")

    # Combine title and description into a single text field
    df["text"] = df["title"].fillna("") + " " + df["description"].fillna("")

    # Features and target
    X_text = df["text"]
    X_numeric = df[["days_until_deadline", "assignee_active_tasks",
                     "assignee_overdue_rate", "assignee_avg_completion_delay"]]
    X_project = df[["project_name"]]
    y = df["priority"]

    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    # Build preprocessing pipeline
    text_transformer = TfidfVectorizer(max_features=2000, stop_words="english", ngram_range=(1, 2))
    project_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    # We need a custom approach since we have mixed feature types
    # First, transform text features
    print("Engineering features...")
    X_text_features = text_transformer.fit_transform(X_text).toarray()
    X_project_features = project_transformer.fit_transform(X_project)
    X_numeric_values = X_numeric.values

    # Combine all features
    X_combined = np.hstack([X_text_features, X_numeric_values, X_project_features])
    print(f"Total features: {X_combined.shape[1]}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_combined, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # Train RandomForest
    print("Training RandomForest classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    # Cross-validation score
    cv_scores = cross_val_score(model, X_combined, y_encoded, cv=5, scoring="accuracy")
    print(f"Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Save all model components
    os.makedirs(output_path, exist_ok=True)

    joblib.dump(model, os.path.join(output_path, "classifier.pkl"))
    joblib.dump(text_transformer, os.path.join(output_path, "tfidf_vectorizer.pkl"))
    joblib.dump(project_transformer, os.path.join(output_path, "project_encoder.pkl"))
    joblib.dump(label_encoder, os.path.join(output_path, "label_encoder.pkl"))

    print(f"\nModel saved to {output_path}/")
    print("Files: classifier.pkl, tfidf_vectorizer.pkl, project_encoder.pkl, label_encoder.pkl")

    return model, text_transformer, project_transformer, label_encoder

if __name__ == "__main__":
    train_model()
