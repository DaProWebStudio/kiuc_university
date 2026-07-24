from modeltranslation.translator import register, TranslationOptions
from .models import InternationalCooperation, ReceptionPage, SiteContact, ContactPerson


@register(InternationalCooperation)
class InternationalCooperationTranslation(TranslationOptions):
    fields = ('title', 'description',)


@register(ReceptionPage)
class ReceptionPageTranslation(TranslationOptions):
    fields = ('heading', 'lead', 'body', 'contacts_title')


@register(SiteContact)
class SiteContactTranslation(TranslationOptions):
    fields = ('address_short', 'address_full')


@register(ContactPerson)
class ContactPersonTranslation(TranslationOptions):
    fields = ('full_name', 'position')
