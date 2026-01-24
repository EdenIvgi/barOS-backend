import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    resources: {
      en: {
        translation: {
          home: 'Home',
          menu: 'Menu',
          reveiws: 'Reviews',
          profile: 'Profile',
          about: 'About',
          i18: 'internationalization',
        },
      },
      es: {
        translation: {
          home: 'Inicio',
          menu: 'Menú',
          reveiws: 'Reseñas',
          profile: 'Perfil',
          about: 'Acerca de',
          i18: 'internacionalización',
        },
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  })

export default i18n
