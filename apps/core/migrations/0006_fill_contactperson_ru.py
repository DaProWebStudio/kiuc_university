"""Дописывает ФИО и должность менеджера в *_ru, которые оставила пустыми 0005.

0005 создавала ContactPerson через историческую модель и заполнила только базовые
full_name / position. Сайт и админка через modeltranslation читают *_<язык>, поэтому
на «Контактах» у менеджера выводились одни телефоны, а сохранить SiteContact в
админке не давало пустое обязательное «ФИО [ru]». en/ky откатываются на ru сами.
"""
from django.db import migrations
from django.db.models import F, Q

FIELDS = ('full_name', 'position')


def fill_ru(apps, schema_editor):
    ContactPerson = apps.get_model('core', 'ContactPerson')
    for field in FIELDS:
        ru = f'{field}_ru'
        (ContactPerson.objects
         .filter(Q(**{f'{ru}__isnull': True}) | Q(**{ru: ''}))
         .exclude(**{field: ''})
         .update(**{ru: F(field)}))


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_seed_site_contacts'),
    ]

    operations = [
        migrations.RunPython(fill_ru, migrations.RunPython.noop),
    ]
