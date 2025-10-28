#!/usr/bin/env python
"""
Script to populate the database with sample data for admin testing
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bibly_backend.settings')
django.setup()

from api.models import User, BibleVersion, Verse, Highlight, Devotional, PrayerRequest, Post, Comment, Blog
from django.utils import timezone

def create_sample_data():
    print("Creating sample data for admin...")
    
    # Create test users
    user1, created = User.objects.get_or_create(
        username='testuser1',
        email='test1@example.com',
        defaults={
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'bio': 'Estudiante de la Biblia apasionado'
        }
    )
    if created:
        user1.set_password('testpass123')
        user1.save()
        print(f"✅ Created user: {user1.username}")
    
    user2, created = User.objects.get_or_create(
        username='testuser2',
        email='test2@example.com',
        defaults={
            'first_name': 'María',
            'last_name': 'García',
            'bio': 'Maestra de escuela dominical'
        }
    )
    if created:
        user2.set_password('testpass123')
        user2.save()
        print(f"✅ Created user: {user2.username}")
    
    # Create Bible Version
    bible_version, created = BibleVersion.objects.get_or_create(
        name='Reina Valera 1960',
        abbreviation='RVR60',
        language='Spanish',
        owner=user1
    )
    if created:
        print(f"✅ Created Bible version: {bible_version.name}")
    
    # Create sample verses
    sample_verses = [
        ('Genesis', 1, 1, 'En el principio creó Dios los cielos y la tierra.'),
        ('Genesis', 1, 2, 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.'),
        ('Juan', 3, 16, 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'),
        ('Salmos', 23, 1, 'Jehová es mi pastor; nada me faltará.'),
        ('Filipenses', 4, 13, 'Todo lo puedo en Cristo que me fortalece.'),
    ]
    
    for book, chapter, verse_num, text in sample_verses:
        verse, created = Verse.objects.get_or_create(
            bible_version=bible_version,
            book=book,
            chapter=chapter,
            verse_number=verse_num,
            defaults={'text': text}
        )
        if created:
            print(f"✅ Created verse: {verse}")
    
    # Create highlights
    verses = Verse.objects.all()
    if verses.exists():
        highlight, created = Highlight.objects.get_or_create(
            user=user1,
            verse=verses.first(),
            color='yellow',
            defaults={'note': 'Este versículo es muy importante para mí'}
        )
        if created:
            print(f"✅ Created highlight: {highlight}")
    
    # Create devotional
    devotional, created = Devotional.objects.get_or_create(
        title='Reflexión sobre el Amor de Dios',
        user=user1,
        defaults={
            'content': 'Juan 3:16 nos muestra el increíble amor de Dios por nosotros. Este versículo es el corazón del evangelio...'
        }
    )
    if created and verses.exists():
        devotional.verses.add(verses.get(book='Juan', chapter=3, verse_number=16))
        print(f"✅ Created devotional: {devotional.title}")
    
    # Create prayer request
    prayer, created = PrayerRequest.objects.get_or_create(
        title='Oración por la familia',
        user=user1,
        defaults={
            'description': 'Por favor oren por mi familia, estamos pasando por un momento difícil.'
        }
    )
    if created:
        print(f"✅ Created prayer request: {prayer.title}")
    
    # Create post
    post, created = Post.objects.get_or_create(
        user=user2,
        defaults={
            'content': '¡Qué hermoso día para estudiar la Palabra de Dios! 📖✨ #BibleStudy #Faith'
        }
    )
    if created:
        print(f"✅ Created post by {post.user.username}")
    
    # Create comment
    if Post.objects.exists():
        comment, created = Comment.objects.get_or_create(
            user=user1,
            post=Post.objects.first(),
            defaults={
                'content': '¡Amén! Que Dios te bendiga en tu estudio. 🙏'
            }
        )
        if created:
            print(f"✅ Created comment by {comment.user.username}")
    
    # Create blog
    blog, created = Blog.objects.get_or_create(
        title='La Importancia de la Oración Diaria',
        user=user2,
        defaults={
            'content': '''
            La oración es una de las disciplinas espirituales más importantes en la vida cristiana. 
            A través de la oración, nos comunicamos directamente con Dios, expresamos nuestras 
            necesidades, agradecimientos y adoración.
            
            En 1 Tesalonicenses 5:17, Pablo nos exhorta a "orar sin cesar". Esto no significa 
            que debemos estar constantemente de rodillas, sino que debemos mantener una actitud 
            de oración y comunión con Dios a lo largo del día.
            '''
        }
    )
    if created:
        print(f"✅ Created blog: {blog.title}")
    
    print("\n🎉 Sample data creation completed!")
    print("\nNow you can see all models in Django Admin:")
    print("- Users: 2 test users")
    print("- Bible Versions: 1 (RVR60)")
    print("- Verses: 5 sample verses")
    print("- Highlights: 1 sample highlight")
    print("- Devotionals: 1 sample devotional")
    print("- Prayer Requests: 1 sample prayer")
    print("- Posts: 1 sample post")
    print("- Comments: 1 sample comment")
    print("- Blogs: 1 sample blog")

if __name__ == '__main__':
    create_sample_data()