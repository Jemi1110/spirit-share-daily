from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    """Extended User model"""
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)
    
    USERNAME_FIELD = 'email'  # Use email for authentication
    REQUIRED_FIELDS = ['username']  # Username is still required but not for login
    
    # Override email to make it unique
    email = models.EmailField(unique=True)
    
    def __str__(self):
        return self.username

class BibleVersion(models.Model):
    """Bible version uploads"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10)
    language = models.CharField(max_length=50, default='English')
    file = models.FileField(upload_to='bibles/', null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bible_versions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.abbreviation})"

class Verse(models.Model):
    """Individual Bible verses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bible_version = models.ForeignKey(BibleVersion, on_delete=models.CASCADE, related_name='verses')
    book = models.CharField(max_length=50)
    chapter = models.IntegerField()
    verse_number = models.IntegerField()
    text = models.TextField()
    
    class Meta:
        ordering = ['book', 'chapter', 'verse_number']
        unique_together = ['bible_version', 'book', 'chapter', 'verse_number']
    
    def __str__(self):
        return f"{self.book} {self.chapter}:{self.verse_number}"

class Highlight(models.Model):
    """User highlights and notes"""
    COLOR_CHOICES = [
        ('yellow', 'Yellow'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('pink', 'Pink'),
        ('orange', 'Orange'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='highlights')
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='highlights')
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='yellow')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.verse}"

class Devotional(models.Model):
    """User-created devotionals"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devotionals')
    verses = models.ManyToManyField(Verse, related_name='devotionals', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class StudyMaterial(models.Model):
    """Uploaded study materials"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='materials/', null=True, blank=True)
    link = models.URLField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Document(models.Model):
    """User uploaded documents (PDFs, EPUBs, XMLs, etc.)"""
    DOCUMENT_TYPES = [
        ('pdf', 'PDF Document'),
        ('epub', 'EPUB Book'),
        ('xml', 'XML Bible'),
        ('json', 'JSON Bible'),
        ('txt', 'Text File'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='documents/%Y/%m/')
    file_type = models.CharField(max_length=10, choices=DOCUMENT_TYPES)
    file_size = models.BigIntegerField()  # Size in bytes
    is_bible = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    # Collaboration
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_documents')
    collaborators = models.ManyToManyField(User, related_name='shared_documents', blank=True)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    parsed_content = models.JSONField(null=True, blank=True)  # For Bible content
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def file_size_mb(self):
        return round(self.file_size / (1024 * 1024), 2)

class PrayerRequest(models.Model):
    """Prayer requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prayer_requests', null=True, blank=True)
    prayed_by = models.ManyToManyField(User, related_name='prayers_given', blank=True)
    is_answered = models.BooleanField(default=False)
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class Post(models.Model):
    """Social media posts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    audio = models.FileField(upload_to='posts/audio/', null=True, blank=True)
    video = models.FileField(upload_to='posts/video/', null=True, blank=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

class Comment(models.Model):
    """Comments on posts or verses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} - Comment"

class Blog(models.Model):
    """Long-form blog articles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs', null=True, blank=True)
    image = models.ImageField(upload_to='blogs/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
