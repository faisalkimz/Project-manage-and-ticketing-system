from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, TaskChecklistItemViewSet, TagViewSet, MilestoneViewSet,
    ProjectCategoryViewSet, PortfolioViewSet, ProgramViewSet,
    ProjectGoalViewSet, DeliverableViewSet, ProjectStatusViewSet,
    SprintViewSet, ReleaseViewSet, SprintRetrospectiveViewSet, SprintCapacityViewSet,
    RemindersViewSet, CustomFieldDefinitionViewSet, TaskTemplateViewSet,
    ReportViewSet, ScheduledReportViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'checklists', TaskChecklistItemViewSet)
router.register(r'tags', TagViewSet)
router.register(r'custom-fields', CustomFieldDefinitionViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'categories', ProjectCategoryViewSet)
router.register(r'portfolios', PortfolioViewSet)
router.register(r'programs', ProgramViewSet)
router.register(r'goals', ProjectGoalViewSet)
router.register(r'deliverables', DeliverableViewSet)
router.register(r'statuses', ProjectStatusViewSet)
router.register(r'sprints', SprintViewSet)
router.register(r'releases', ReleaseViewSet)
router.register(r'retrospectives', SprintRetrospectiveViewSet)
router.register(r'capacities', SprintCapacityViewSet)
router.register(r'reminders', RemindersViewSet, basename='reminders')
router.register(r'task-templates', TaskTemplateViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'scheduled-reports', ScheduledReportViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
