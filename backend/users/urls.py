from django.urls.conf import path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()

router.register("users", views.UserViewSet, basename="users")

urlpatterns = [
    path("login/", views.LoginView.as_view()),
    path("user/", views.ObtainBaseInfo.as_view()),
    path("users/supervisors/", views.SupervisorDropdown.as_view()),
]

urlpatterns += router.urls
