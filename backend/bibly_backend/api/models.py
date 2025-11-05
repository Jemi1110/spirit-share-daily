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

class BookHighlight(models.Model):
    """Highlights for books/documents (separate from Bible highlights)"""
    COLOR_CHOICES = [
        ('yellow', 'Yellow'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('pink', 'Pink'),
        ('orange', 'Orange'),
        ('purple', 'Purple'),
    ]
    
    id = models.CharField(max_length=255, primary_key=True)  # To match frontend IDs
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_highlights')
    user_name = models.CharField(max_length=255)  # Denormalized for performance
    
    # Document/Book info
    document_id = models.CharField(max_length=255, default='epub-book')
    document_title = models.CharField(max_length=500, default='EPUB Book')
    
    # Chapter/Location info
    chapter_number = models.IntegerField()
    chapter_title = models.CharField(max_length=500, blank=True)
    
    # Highlight content
    highlighted_text = models.TextField()
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='yellow')
    
    # Position info (for precise location)
    start_offset = models.IntegerField(default=0)
    end_offset = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'document_id']),
            models.Index(fields=['document_id', 'chapter_number']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user_name} - {self.document_title} Ch.{self.chapter_number}: {self.highlighted_text[:50]}..."

class BookHighlightComment(models.Model):
    """Comments on book highlights"""
    id = models.CharField(max_length=255, primary_key=True)
    highlight = models.ForeignKey(BookHighlight, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_highlight_comments')
    user_name = models.CharField(max_length=255)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user_name} on {self.highlight.highlighted_text[:30]}..."

class ReadingProgress(models.Model):
    """Reading progress for documents - supports both authenticated and anonymous users"""
    # User identification (supports both authenticated and anonymous users)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reading_progress')
    session_key = models.CharField(max_length=40, null=True, blank=True)
    
    # Progress data
    document_id = models.CharField(max_length=255)
    current_chapter = models.IntegerField(default=1)
    scroll_position = models.IntegerField(default=0)
    total_chapters = models.IntegerField(default=1)
    reading_time_minutes = models.IntegerField(default=0)
    
    # Timestamps
    last_read_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [
            ['user', 'document_id'],
            ['session_key', 'document_id']
        ]
        indexes = [
            models.Index(fields=['user', 'document_id']),
            models.Index(fields=['session_key', 'document_id']),
            models.Index(fields=['last_read_at']),
        ]
        ordering = ['-last_read_at']
    
    def clean(self):
        from django.core.exceptions import ValidationError
        # Ensure either user or session_key is provided
        if not self.user and not self.session_key:
            raise ValidationError('Either user or session_key must be provided')
    
    def __str__(self):
        identifier = self.user.username if self.user else f"Session: {self.session_key[:8]}..."
        return f"{identifier} - {self.document_id} - Chapter {self.current_chapter}"

    @property
    def progress_percentage(self):
        if self.total_chapters == 0:
            return 0
        return round((self.current_chapter / self.total_chapters) * 100, 1)
