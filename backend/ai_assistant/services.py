import os
import time
import json
import logging
from django.conf import settings
from .models import AIRequestLog

logger = logging.getLogger(__name__)

class AIService:
    @classmethod
    def _get_openai_client(cls):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return None
        try:
            from openai import OpenAI
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None

    @classmethod
    def generate_summary(cls, text, user=None, max_length=150):
        """
        Generate a concise summary of tasks, tickets, or project discussions.
        """
        start_time = time.time()
        client = cls._get_openai_client()
        model = os.getenv('AI_MODEL', 'gpt-4o-mini')
        output_text = ""
        tokens = 0
        status = "SUCCESS"

        if client and text.strip():
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an executive project management AI assistant. Provide a clear, concise, actionable summary of the following work item or discussion."},
                        {"role": "user", "content": text}
                    ],
                    max_tokens=max_length,
                    temperature=0.3
                )
                output_text = response.choices[0].message.content.strip()
                tokens = response.usage.total_tokens if response.usage else 0
            except Exception as e:
                logger.error(f"OpenAI error in generate_summary: {e}")
                status = "FAILED"
                output_text = cls._fallback_summary(text)
        else:
            output_text = cls._fallback_summary(text)

        elapsed_ms = int((time.time() - start_time) * 1000)

        if user and user.is_authenticated:
            AIRequestLog.objects.create(
                user=user,
                request_type='SUMMARIZE',
                input_text=text[:1000],
                output_text=output_text,
                status=status,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms
            )

        return output_text

    @classmethod
    def suggest_next_tasks(cls, project_name="", current_tasks=None, user=None):
        """
        Suggest recommended next sprint/project tasks based on context.
        """
        start_time = time.time()
        client = cls._get_openai_client()
        model = os.getenv('AI_MODEL', 'gpt-4o-mini')
        suggestions = []
        tokens = 0
        status = "SUCCESS"

        task_titles = [t.get('title', '') if isinstance(t, dict) else str(t) for t in (current_tasks or [])]
        context = f"Project: {project_name}\nCurrent tasks: {', '.join(task_titles)}"

        if client:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an Agile Product Owner. Given project context and existing tasks, "
                                "recommend 3 to 5 logical next tasks. Return ONLY valid JSON in the format: "
                                '[{"title": "...", "description": "...", "priority": "HIGH|MEDIUM|LOW", "estimated_hours": 4}]'
                            )
                        },
                        {"role": "user", "content": context}
                    ],
                    temperature=0.4
                )
                raw_json = response.choices[0].message.content.strip()
                # Clean code blocks if present
                if raw_json.startswith("```"):
                    raw_json = raw_json.strip("`").replace("json\n", "", 1).strip()
                suggestions = json.loads(raw_json)
                tokens = response.usage.total_tokens if response.usage else 0
            except Exception as e:
                logger.error(f"OpenAI error in suggest_next_tasks: {e}")
                status = "FAILED"
                suggestions = cls._fallback_task_suggestions(project_name)
        else:
            suggestions = cls._fallback_task_suggestions(project_name)

        elapsed_ms = int((time.time() - start_time) * 1000)

        if user and user.is_authenticated:
            AIRequestLog.objects.create(
                user=user,
                request_type='SUGGEST',
                input_text=context[:1000],
                output_text=json.dumps(suggestions),
                status=status,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms
            )

        return suggestions

    @classmethod
    def breakdown_task(cls, title, description="", user=None):
        """
        Break down a parent task or epic into actionable subtasks.
        """
        start_time = time.time()
        client = cls._get_openai_client()
        model = os.getenv('AI_MODEL', 'gpt-4o-mini')
        subtasks = []
        tokens = 0
        status = "SUCCESS"
        context = f"Task Title: {title}\nDescription: {description}"

        if client:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a Senior Technical Lead. Break down the given task into 3-6 clear, actionable subtasks. "
                                "Return ONLY valid JSON format: "
                                '[{"title": "...", "priority": "HIGH|MEDIUM|LOW", "estimated_hours": 2}]'
                            )
                        },
                        {"role": "user", "content": context}
                    ],
                    temperature=0.3
                )
                raw_json = response.choices[0].message.content.strip()
                if raw_json.startswith("```"):
                    raw_json = raw_json.strip("`").replace("json\n", "", 1).strip()
                subtasks = json.loads(raw_json)
                tokens = response.usage.total_tokens if response.usage else 0
            except Exception as e:
                logger.error(f"OpenAI error in breakdown_task: {e}")
                status = "FAILED"
                subtasks = cls._fallback_task_breakdown(title)
        else:
            subtasks = cls._fallback_task_breakdown(title)

        elapsed_ms = int((time.time() - start_time) * 1000)

        if user and user.is_authenticated:
            AIRequestLog.objects.create(
                user=user,
                request_type='GENERATE',
                input_text=context[:1000],
                output_text=json.dumps(subtasks),
                status=status,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms
            )

        return subtasks

    @classmethod
    def prioritize_ticket(cls, title, description="", customer_tier="STANDARD", user=None):
        """
        Analyze ticket urgency and impact, recommending priority and suggested tags.
        """
        start_time = time.time()
        client = cls._get_openai_client()
        model = os.getenv('AI_MODEL', 'gpt-4o-mini')
        result = {}
        tokens = 0
        status = "SUCCESS"
        context = f"Ticket: {title}\nDescription: {description}\nCustomer Tier: {customer_tier}"

        if client:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an automated Customer Support Triage AI. Analyze the issue and determine "
                                "the appropriate priority (CRITICAL, HIGH, MEDIUM, LOW), estimated response SLA hours, "
                                "and recommended resolution category. Return ONLY JSON format: "
                                '{"priority": "HIGH", "category": "BUG|BILLING|FEATURE|SECURITY", "reasoning": "...", "sla_target_hours": 4}'
                            )
                        },
                        {"role": "user", "content": context}
                    ],
                    temperature=0.2
                )
                raw_json = response.choices[0].message.content.strip()
                if raw_json.startswith("```"):
                    raw_json = raw_json.strip("`").replace("json\n", "", 1).strip()
                result = json.loads(raw_json)
                tokens = response.usage.total_tokens if response.usage else 0
            except Exception as e:
                logger.error(f"OpenAI error in prioritize_ticket: {e}")
                status = "FAILED"
                result = cls._fallback_prioritize(title, description, customer_tier)
        else:
            result = cls._fallback_prioritize(title, description, customer_tier)

        elapsed_ms = int((time.time() - start_time) * 1000)

        if user and user.is_authenticated:
            AIRequestLog.objects.create(
                user=user,
                request_type='PRIORITIZE',
                input_text=context[:1000],
                output_text=json.dumps(result),
                status=status,
                tokens_used=tokens,
                processing_time_ms=elapsed_ms
            )

        return result

    # --- Heuristic Fallbacks (when API key is unset or network offline) ---

    @staticmethod
    def _fallback_summary(text):
        cleaned = text.strip().replace('\r', '')
        lines = [line.strip() for line in cleaned.split('\n') if line.strip()]
        if not lines:
            return "No content available to summarize."
        if len(lines) == 1:
            first = lines[0]
            return first if len(first) <= 120 else f"{first[:117]}..."
        return f"Summary: {lines[0]} (Key points: {', '.join(lines[1:3])})"

    @staticmethod
    def _fallback_task_suggestions(project_name):
        return [
            {"title": "Architecture & Schema Review", "description": "Verify database indexes, relationships, and API contracts.", "priority": "HIGH", "estimated_hours": 4},
            {"title": "Automated Unit & Integration Tests", "description": "Write regression tests for core workflows and endpoints.", "priority": "HIGH", "estimated_hours": 6},
            {"title": "Security & Permission Audit", "description": "Ensure RBAC permissions guard every endpoint.", "priority": "MEDIUM", "estimated_hours": 3},
            {"title": "User Documentation & API Spec", "description": "Update Swagger docs and user onboarding guides.", "priority": "LOW", "estimated_hours": 2}
        ]

    @staticmethod
    def _fallback_task_breakdown(title):
        return [
            {"title": f"Requirements & Design for {title}", "priority": "MEDIUM", "estimated_hours": 2},
            {"title": f"Backend API & Database Implementation for {title}", "priority": "HIGH", "estimated_hours": 4},
            {"title": f"Frontend UI & Integration for {title}", "priority": "HIGH", "estimated_hours": 4},
            {"title": f"QA & Edge Case Testing for {title}", "priority": "MEDIUM", "estimated_hours": 2}
        ]

    @staticmethod
    def _fallback_prioritize(title, description, customer_tier):
        text = f"{title} {description}".lower()
        if any(w in text for w in ['down', 'outage', 'crash', 'security', 'vulnerability', 'data loss', 'urgent']):
            priority = 'CRITICAL'
            sla = 1
            cat = 'SECURITY' if 'security' in text else 'BUG'
        elif any(w in text for w in ['broken', 'error', 'fails', 'bug', 'cannot', 'blocked', 'payment']):
            priority = 'HIGH'
            sla = 4
            cat = 'BILLING' if 'payment' in text else 'BUG'
        elif any(w in text for w in ['feature', 'request', 'suggestion', 'idea', 'nice to have']):
            priority = 'LOW'
            sla = 48
            cat = 'FEATURE'
        else:
            priority = 'MEDIUM'
            sla = 24
            cat = 'BUG'

        if customer_tier.upper() in ['ENTERPRISE', 'VIP'] and priority in ['HIGH', 'MEDIUM']:
            sla = max(1, sla // 2)

        return {
            "priority": priority,
            "category": cat,
            "reasoning": f"Determined from keywords and customer tier '{customer_tier}'.",
            "sla_target_hours": sla
        }
