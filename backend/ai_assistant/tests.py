from django.test import TestCase
from .services import AIService

class AIServiceTests(TestCase):
    def test_summary_generation_fallback(self):
        text = "This is a sprint goal to finish user authentication."
        summary = AIService.generate_summary(text)
        self.assertTrue(len(summary) > 0)
        self.assertIn("authentication", summary.lower())

    def test_task_breakdown_fallback(self):
        subtasks = AIService.breakdown_task("Implement Payment Gateway")
        self.assertTrue(isinstance(subtasks, list))
        self.assertGreaterEqual(len(subtasks), 2)
        self.assertIn("title", subtasks[0])

    def test_prioritize_ticket_fallback(self):
        result = AIService.prioritize_ticket(
            title="Database is down in production outage!",
            description="Users cannot login and receive 500 errors",
            customer_tier="ENTERPRISE"
        )
        self.assertEqual(result.get("priority"), "CRITICAL")
