class AIService:
    @staticmethod
    def generate_summary(text):
        """
        Placeholder for AI integration (OpenAI/Gemini).
        """
        return f"AI Summary: {text[:50]}..."

    @staticmethod
    def suggest_next_tasks(project_id):
        return [
            {"title": "Review Code", "priority": "HIGH"},
            {"title": "Update Documentation", "priority": "MEDIUM"}
        ]
