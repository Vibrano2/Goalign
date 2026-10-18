from django.db import models
from django.contrib.auth.models import User

class GoalignProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='goalign_profile')
    firebase_uid = models.CharField(max_length=128, unique=True, db_index=True)

    def __str__(self):
        return f"{self.user.username} ({self.firebase_uid})"

class GoalignAccount(models.Model):
    id = models.AutoField(primary_key=True)
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email = models.CharField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255, null=True, blank=True)
    display_name = models.CharField(max_length=255, null=True, blank=True)
    vip_level = models.IntegerField(default=0)
    is_admin = models.BooleanField(default=False)
    kyc_status = models.CharField(max_length=20, default='unverified')
    web3_eth_address = models.CharField(max_length=255, null=True, blank=True)
    web3_sol_address = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return f"{self.email} ({self.display_name or 'No name'})"
