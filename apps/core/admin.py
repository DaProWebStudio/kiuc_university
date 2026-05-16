from django.contrib import admin
from django.utils.safestring import mark_safe
from modeltranslation.admin import TabbedTranslationAdmin

from .models import (
    Cooperation,
    InternationalCooperation,
    InternationalCooperationImages,
    Document,
    DocumentFile, EduProcessFile, EduProcess,
    ReceptionPage,
)


admin.site.site_title = 'Админ-панель сайта КИЯК'
admin.site.site_header = 'Админ-панель сайта КИЯК'


@admin.register(Cooperation)
class CooperationAdmin(admin.ModelAdmin):
    list_display = ('title',)


class InternationalImagesInline(admin.TabularInline):
    model = InternationalCooperationImages
    extra = 1
    readonly_fields = ('get_photo',)

    def get_photo(self, obj):
        return mark_safe(f'<img src="{obj.image.url}" width="75">')

    get_photo.short_description = "Миниатюра"


@admin.register(InternationalCooperation)
class InternationalCooperationAdmin(TabbedTranslationAdmin):
    model = InternationalCooperation
    list_display = ('title', 'get_photo')
    inlines = [InternationalImagesInline]
    readonly_fields = ('get_photo',)

    exclude = ('slug',)

    def get_photo(self, obj):
        return mark_safe(f'<img src="{obj.image.url}" width="75">')

    get_photo.short_description = "Миниатюра"


class DocumentFileInlines(admin.TabularInline):
    model = DocumentFile
    extra = 1


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title',)
    inlines = [DocumentFileInlines]


class EduProcessFileInlines(admin.TabularInline):
    model = EduProcessFile
    extra = 1


@admin.register(EduProcess)
class EduProcessAdmin(admin.ModelAdmin):
    list_display = ('title',)
    inlines = [EduProcessFileInlines]


@admin.register(ReceptionPage)
class ReceptionPageAdmin(TabbedTranslationAdmin):
    fieldsets = (
        ('Хиро (заголовок страницы)', {
            'fields': ('heading', 'heading_italic', 'lead'),
        }),
        ('Основной текст', {
            'fields': ('body',),
            'description': 'Большой блок с правилами поступления, стоимостью, требованиями к документам и т.д. '
                           'Поддерживает форматирование, списки, цитаты — всё через WYSIWYG.',
        }),
        ('Сайдбар «Контакты приёмной»', {
            'fields': ('contacts_title', 'contact_phone', 'contact_whatsapp',
                       'contact_email', 'contact_website_label', 'contact_website_url'),
        }),
    )

    def has_add_permission(self, request):
        # Singleton: разрешаем добавление только пока записи нет
        return not ReceptionPage.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Singleton: запретить удаление через админку
        return False

    def changelist_view(self, request, extra_context=None):
        # Если запись существует — сразу открываем её на редактирование,
        # минуя список. Если нет — пускаем на создание.
        obj = ReceptionPage.objects.first()
        if obj:
            from django.shortcuts import redirect
            from django.urls import reverse
            return redirect(reverse('admin:core_receptionpage_change', args=[obj.pk]))
        return super().changelist_view(request, extra_context)
