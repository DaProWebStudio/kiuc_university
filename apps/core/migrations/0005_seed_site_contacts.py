"""Переносит контакты, ранее захардкоженные в шаблонах, в singleton SiteContact.

До этой миграции телефоны, адрес, соцсети и менеджер приёмной жили прямо в
templates/base/base.html и apps/feedback/templates/contacts.html. Создаём запись
с теми же значениями, чтобы после перехода на админку сайт выглядел как прежде.
"""
from django.db import migrations

MANAGER = {
    'number': 1,
    'full_name': 'Алиева Наргиза Жумадиловна',
    'position': 'Менеджер приёмной комиссии',
    'whatsapp': '+996 (552) 95-56-77',
    'phone': '+996 (706) 95-56-77',
    'is_active': True,
}


def create_contacts(apps, schema_editor):
    SiteContact = apps.get_model('core', 'SiteContact')
    ContactPerson = apps.get_model('core', 'ContactPerson')

    # Поля модели уже несут нужные значения в default — достаточно создать запись.
    contact, _created = SiteContact.objects.get_or_create(pk=1)

    if not ContactPerson.objects.filter(contact=contact).exists():
        ContactPerson.objects.create(contact=contact, **MANAGER)


def drop_contacts(apps, schema_editor):
    SiteContact = apps.get_model('core', 'SiteContact')
    ContactPerson = apps.get_model('core', 'ContactPerson')
    ContactPerson.objects.filter(full_name=MANAGER['full_name']).delete()
    SiteContact.objects.filter(pk=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_sitecontact_contactperson'),
    ]

    operations = [
        migrations.RunPython(create_contacts, drop_contacts),
    ]
