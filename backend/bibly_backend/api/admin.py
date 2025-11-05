from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, BibleVersion, Verse, Highlight, Devotional, 
    StudyMaterial, Document, PrayerRequest, Post, Comment, Blog,
    BookHighlight, BookHighlightComment, ReadingProgress
)

# Custom User Admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('bio', 'avatar', 'followers')}),
    )

# Bible Version Admin
@admin.register(BibleVersion)
class BibleVersionAdmin(admin.ModelAdmin):
    list_display = ('name', 'abbreviation', 'language', 'owner', 'created_at')
    list_filter = ('language', 'created_at')
    search_fields = ('name', 'abbreviation', 'owner__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')

# Verse Admin
@admin.register(Verse)
class VerseAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'bible_version', 'book', 'chapter', 'verse_number')
    list_filter = ('bible_version', 'book')
    search_fields = ('book', 'text', 'bible_version__name')
    ordering = ('bible_version', 'book', 'chapter', 'verse_number')
    readonly_fields = ('id',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('bible_version')

# Highlight Admin
@admin.register(Highlight)
class HighlightAdmin(admin.ModelAdmin):
    list_display = ('user', 'verse', 'color', 'created_at')
    list_filter = ('color', 'created_at', 'verse__bible_version')
    search_fields = ('user__username', 'verse__text', 'note')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'verse')

# Devotional Admin
@admin.register(Devotional)
class DevotionalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title', 'content', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('verses',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Study Material Admin
@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Prayer Request Admin
@admin.register(PrayerRequest)
class PrayerRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_answered', 'created_at', 'prayer_count')
    list_filter = ('is_answered', 'created_at', 'answered_at')
    search_fields = ('title', 'description', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    filter_horizontal = ('prayed_by',)
    
    def prayer_count(self, obj):
        return obj.prayed_by.count()
    prayer_count.short_description = 'Prayers Count'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('prayed_by')

# Post Admin
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_preview', 'likes_count', 'comments_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    filter_horizontal = ('likes',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
    
    def likes_count(self, obj):
        return obj.likes.count()
    likes_count.short_description = 'Likes'
    
    def comments_count(self, obj):
        return obj.comments.count()
    comments_count.short_description = 'Comments'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('likes', 'comments')

# Comment Admin
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_preview', 'post', 'verse', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post', 'verse')

# Blog Admin
@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title', 'content', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Document Admin
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'file_type', 'is_bible', 'is_public', 'owner', 'file_size_mb', 'created_at')
    list_filter = ('file_type', 'is_bible', 'is_public', 'created_at')
    search_fields = ('name', 'description', 'owner__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'file_size', 'created_at', 'updated_at')
    filter_horizontal = ('collaborators',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner').prefetch_related('collaborators')

# Book Highlight Admin
@admin.register(BookHighlight)
class BookHighlightAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_name', 'document_title', 'chapter_number', 'highlighted_text_preview', 'color', 'created_at')
    list_filter = ('color', 'document_id', 'chapter_number', 'created_at')
    search_fields = ('user_name', 'document_title', 'highlighted_text', 'chapter_title')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'user_name')
        }),
        ('Document Info', {
            'fields': ('document_id', 'document_title', 'chapter_number', 'chapter_title')
        }),
        ('Highlight Content', {
            'fields': ('highlighted_text', 'color', 'start_offset', 'end_offset')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def highlighted_text_preview(self, obj):
        return obj.highlighted_text[:50] + "..." if len(obj.highlighted_text) > 50 else obj.highlighted_text
    highlighted_text_preview.short_description = 'Text Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Book Highlight Comment Admin
@admin.register(BookHighlightComment)
class BookHighlightCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_name', 'highlight_preview', 'text_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user_name', 'text', 'highlight__highlighted_text')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def highlight_preview(self, obj):
        return obj.highlight.highlighted_text[:30] + "..."
    highlight_preview.short_description = 'Highlight'
    
    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Comment'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'highlight')

# Reading Progress Admin
@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = [
        'get_identifier', 'document_id', 'current_chapter', 
        'progress_percentage', 'reading_time_minutes', 'last_read_at'
    ]
    list_filter = [
        'current_chapter', 'total_chapters', 'last_read_at', 'created_at'
    ]
    search_fields = [
        'user__username', 'document_id', 'session_key'
    ]
    readonly_fields = ['created_at', 'updated_at', 'progress_percentage', 'last_read_at']
    ordering = ['-last_read_at']
    
    fieldsets = (
        ('User/Session Info', {
            'fields': ('user', 'session_key')
        }),
        ('Document Info', {
            'fields': ('document_id',)
        }),
        ('Progress Data', {
            'fields': ('current_chapter', 'total_chapters', 'scroll_position', 'reading_time_minutes', 'progress_percentage')
        }),
        ('Timestamps', {
            'fields': ('last_read_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_identifier(self, obj):
        if obj.user:
            return f"👤 {obj.user.username}"
        return f"🔗 Session: {obj.session_key[:8]}..."
    get_identifier.short_description = 'User/Session'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Customize Admin Site
admin.site.site_header = "📚 Bibly Administration"
admin.site.site_title = "Bibly Admin"
admin.site.index_title = "Welcome to Bibly Administration"