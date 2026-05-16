from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator

from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFill
from ckeditor.fields import RichTextField

from common.utils import get_english_translit as get_slug
from common.upload_to_files import (
    document_files,
    cooperation_files,
    international_images,
    international_main_img,
    edu_process_files,
    international_pdf
)
from common.managers import ActiveManager
from common import constants as cons


class Cooperation(models.Model):
    """Сотрудничество"""
    title = models.CharField(_("Название"), max_length=255)
    file = models.FileField(_("Файл"), validators=[FileExtensionValidator(['pdf'])], upload_to=cooperation_files)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _('Сотрудничество')
        verbose_name_plural = _('Сотрудничество')


class InternationalCooperation(models.Model):
    """Международное сотрудничество"""
    title = models.CharField(_('Название'), max_length=230)
    slug = models.SlugField("URL", max_length=255, null=True, blank=True)
    description = RichTextField(_('Описание'), blank=True, null=True)
    image = ProcessedImageField(verbose_name=_('Фото'), upload_to=international_main_img, format='webp',
                                processors=[ResizeToFill(2268, 1296)], options={'quality': 90})

    file = models.FileField(_("Договор (PDF)"), validators=[FileExtensionValidator(['pdf'])],
                            upload_to=international_pdf, null=True, blank=True)

    objects = models.Manager()

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.title)

    def save(self, *args, **kwargs):
        self.slug = get_slug(self.title)
        super(InternationalCooperation, self).save(*args, **kwargs)

    def get_absolute_url(self, **kwargs):
        return reverse('international_detail', kwargs={'slug': self.slug})

    class Meta:
        ordering = ('-created',)
        verbose_name = _('Международное сотрудничество')
        verbose_name_plural = _('Международные сотрудничество')


class InternationalCooperationImages(models.Model):
    """Фотографии Международное сотрудничество"""
    international = models.ForeignKey(InternationalCooperation, on_delete=models.CASCADE, related_name='images')
    image = ProcessedImageField(verbose_name=_('Фотография'), upload_to=international_images, format='webp', options={'quality': 80})

    def __str__(self):
        return str(self.international.title)

    class Meta:
        verbose_name = _('Фотография')
        verbose_name_plural = _('Фотографии')


class Document(models.Model):
    title = models.CharField(_("Название"), max_length=255)
    is_active = models.BooleanField(_("Активный"), default=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _('Нормативный документ')
        verbose_name_plural = _('Нормативные документы')


class DocumentFile(models.Model):
    document = models.ForeignKey(Document, verbose_name=_("Документ"), on_delete=models.CASCADE, related_name='files')
    title = models.CharField(_("Название файла"), max_length=255)
    file = models.FileField(
        _("Файл"), validators=[FileExtensionValidator(['pdf', 'png', 'jpg', 'webp'])], upload_to=document_files
    )

    def __str__(self):
        return f'{self.document} - {self.title}'

    class Meta:
        verbose_name = _('Файл документа')
        verbose_name_plural = _('Файлы документа')


class EduProcess(models.Model):
    title = models.CharField(_("Название"), max_length=255)
    is_active = models.BooleanField(_("Активный"), default=True)

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    objects = models.Manager()
    active = ActiveManager()

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _('Учебный процесс')
        verbose_name_plural = _('Учебные процессы')


class EduProcessFile(models.Model):
    process = models.ForeignKey(EduProcess, verbose_name=_("Документ"), on_delete=models.CASCADE, related_name='files')
    title = models.CharField(_("Название файла"), max_length=255)
    file = models.FileField(
        _("Файл"), validators=[FileExtensionValidator(['pdf', 'png', 'jpg', 'webp'])], upload_to=edu_process_files
    )

    def __str__(self):
        return f'{self.process} - {self.title}'

    class Meta:
        verbose_name = _('Файл учебного процесса')
        verbose_name_plural = _('Файлы учебных процессов')


RECEPTION_DEFAULT_BODY = """\
<p>Кыргызский институт языков и культуры ждет Вас!</p>
<p>Наш институт обучает студентов по двум направлениям высшего образования (бакалавриат).</p>

<h5>Срок обучения — 4 года</h5>
<ol>
  <li>Лингвистика</li>
  <li>Туризм</li>
</ol>

<h5>Стоимость обучения — 40 000 сомов</h5>
<ul>
  <li>Абитуриенты принимаются по результатам Общереспубликанского тестирования (ОРТ).</li>
  <li>Пороговый балл — 110.</li>
  <li>ОРТ 180 баллов и выше — 4 года бесплатного обучения (при условии успешной учёбы и активного участия в жизни вуза).</li>
  <li>ОРТ 170 и выше — 1 год бесплатного обучения.</li>
  <li>ОРТ 150 и выше — 1 год с 30 % скидкой.</li>
</ul>

<p>Выпускники колледжа поступают сразу на 2 курс по направлению «Лингвистика» и «Туризм».</p>
<p>Выпускники направления «Лингвистика» могут работать на высокооплачиваемых должностях: преподавателями в государственных и частных школах, колледжах, международных компаниях, а также переводчиками в международных организациях.</p>
<p>Направление «Лингвистика» было и остаётся востребованным.</p>
<p>Выпускники направления «Туризм» смогут работать в туристических агентствах, международных турфирмах, быть гидами.</p>

<blockquote>Добро пожаловать в Кыргызский институт языков и культуры! Желаем успехов — надеемся, что вы станете нашими студентами!</blockquote>

<h5>Основной список документов для поступающих</h5>
<ul>
  <li>Сертификат ОРТ</li>
  <li>Оригинал аттестата за 11 класс (2 копии)</li>
  <li>Паспорт — 2 копии</li>
  <li>Медицинская справка №086-У</li>
  <li>Фотографии 3 × 4 (6 штук)</li>
  <li>Справка с места жительства</li>
</ul>
"""


class ReceptionPage(models.Model):
    """Singleton-страница «Абитуриентам». В админке всегда ровно одна запись —
    редактор института может править hero/lead/основной текст и сайдбар-контакты."""
    heading = models.CharField(_('Заголовок'), max_length=240,
                               default='Дорогие <i>абитуриенты!</i>',
                               help_text=_('Можно вставить HTML — например, оберни слово в '
                                           '&lt;i&gt;...&lt;/i&gt; чтобы выделить курсивом.'))
    lead = models.TextField(_('Подзаголовок'),
                            default='Кыргызский институт языков и культуры ждёт Вас. Два направления '
                                    'бакалавриата, международные стажировки и носители языка.')
    body = RichTextField(_('Основной текст'), blank=True, default=RECEPTION_DEFAULT_BODY)

    contacts_title = models.CharField(_('Заголовок контактов'), max_length=120, default='Контакты приёмной')
    contact_phone = models.CharField(_('Телефон'), max_length=40, blank=True, default='+996 (555) 10-68-86')
    contact_whatsapp = models.CharField(_('WhatsApp (номер)'), max_length=40, blank=True, default='+996 (555) 10-68-86')
    contact_email = models.EmailField(_('Email'), blank=True, default='info@kiuc.kg')
    contact_website_label = models.CharField(_('Подпись сайта'), max_length=120, blank=True, default='2020.edu.gov.kg')
    contact_website_url = models.URLField(_('Ссылка на сайт'), blank=True,
                                          default='https://2020.edu.gov.kg/spuz/reports?id_university=168')

    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(_('Страница «Абитуриентам»'))

    def save(self, *args, **kwargs):
        # Singleton: всегда pk=1, любые попытки создать ещё одну запись
        # схлопываются в обновление существующей.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Не даём удалить singleton через ORM.
        pass

    @classmethod
    def load(cls):
        obj, _created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = _('Страница «Абитуриентам»')
        verbose_name_plural = _('Страница «Абитуриентам»')


class AbstractResume(models.Model):
    GENDER_CHOICES = (
        (cons.MEN, _('Мужской')),
        (cons.WOMEN, _('Женский'))
    )

    number = models.IntegerField(_('Порядковый номер'), null=True, blank=True, default=100)
    last_name = models.CharField(_('Фамилия'), max_length=50)
    first_name = models.CharField(_('Имя'), max_length=50)
    sur_name = models.CharField(_('Отчество'), max_length=50, null=True, blank=True)
    slug = models.SlugField(max_length=250, null=True, blank=True)
    gender = models.CharField(_('Пол'), max_length=10, choices=GENDER_CHOICES, default=cons.MEN)
    date_of_birth = models.DateField(_('День рождения'))
    description = RichTextField(verbose_name='Резюме')
    email = models.EmailField('Email', blank=True, null=True)
    instagram = models.URLField('instagram', blank=True, null=True)
    facebook = models.URLField('facebook', blank=True, null=True)

    is_active = models.BooleanField("Активный", default=True)

    objects = models.Manager()
    active = ActiveManager()

    created = models.DateTimeField(auto_now=True)
    updated = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def get_full_name(self):
        """ Полное имя """
        if self.sur_name:
            return f'{self.last_name} {self.first_name} {self.sur_name}'
        return f'{self.last_name} {self.first_name}'

    def save(self, *args, **kwargs):
        self.slug = get_slug(self.get_full_name())
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.last_name} {self.first_name} {self.sur_name if self.sur_name else ""}'