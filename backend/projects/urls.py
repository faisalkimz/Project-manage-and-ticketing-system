from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, TagViewSet, MilestoneViewSet,
    ProjectCategoryViewSet, PortfolioViewSet, ProgramViewSet,
    ProjectGoalViewSet, DeliverableViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'tags', TagViewSet)
router.register(r'milestones', MilestoneViewSet)
router.register(r'categories', ProjectCategoryViewSet)
router.register(r'portfolios', PortfolioViewSet)
router.register(r'programs', ProgramViewSet)
router.register(r'goals', ProjectGoalViewSet)
router.register(r'deliverables', DeliverableViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
