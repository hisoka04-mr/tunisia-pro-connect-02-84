import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Language = 'ar' | 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    services: 'الخدمات',
    pricing: 'الأسعار',
    contact: 'اتصل بنا',
    bookings: 'الحجوزات',
    admin: 'الإدارة',
    profile: 'الملف الشخصي',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    loginRegister: 'تسجيل الدخول / التسجيل',
    logout: 'تسجيل الخروج',
    
    // Common
    search: 'بحث',
    filter: 'فلتر',
    all: 'الكل',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    
    // Service related
    postService: 'انشر خدمتك',
    findServices: 'ابحث عن الخدمات',
    serviceType: 'نوع الخدمة',
    onSite: 'في الموقع',
    online: 'عبر الإنترنت',
    category: 'الفئة',
    location: 'الموقع',
    
    // Homepage
    popularServices: 'الخدمات الشائعة',
    popularServicesSubtitle: 'اكتشف خدماتنا الأكثر طلباً',
    sameDayService: '✓ خدمة في نفس اليوم متاحة',
    loadingServices: 'جاري تحميل الخدمات...',
    noServicesAvailable: 'لا توجد خدمات متاحة حتى الآن',
    viewAllServices: 'عرض جميع الخدمات',
    
    onlineExperts: 'خبراء عبر الإنترنت والمستقلون',
    onlineExpertsSubtitle: 'تواصل مع المحترفين ذوي الخبرة عبر الإنترنت',
    browseFreelancers: 'تصفح المستقلين',
    
    howItWorks: 'كيف يعمل',
    howItWorksSubtitle: 'خطوات سهلة للحصول على خدمتك',
    step1Title: 'احجز خدمة',
    step1Description: 'اختر الخدمة التي تحتاجها وحدد الوقت المفضل لديك',
    step2Title: 'احصل على مطابقة',
    step2Description: 'سنربطك بمحترف ماهر بالقرب منك',
    step3Title: 'اكتمال الخدمة',
    step3Description: 'يصل المحترف وينجز العمل بما يرضيك',
    
    testimonials: 'ما يقوله عملاؤنا',
    testimonialsSubtitle: 'موثوق من قبل الآلاف في جميع أنحاء تونس',
    
    topProfessionals: 'أفضل محترفينا',
    topProfessionalsSubtitle: 'تعرف على بعض مقدمي الخدمات عالي التقييم لدينا',
    jobsCompleted: 'مهمة مكتملة',
    
    readyToStart: 'مستعد للبدء؟',
    readyToStartSubtitle: 'انضم إلى آلاف العملاء الراضين في جميع أنحاء تونس الذين يثقون في ServiGo لاحتياجات خدمات منازلهم',
    bookNow: 'احجز الآن',
    joinAsProfessional: 'انضم كمحترف',
    tunisianOwned: 'مملوك ومدار تونسياً',
    paymentMethods: 'الدفع: نقداً | فلوسي',
    
    // Hero section
    heroTitle: 'اعثر على أفضل مقدمي الخدمات في تونس',
    heroSubtitle: 'اكتشف واحجز خدمات عالية الجودة من محترفين معتمدين في منطقتك',
    
    // Pricing
    pricingTitle: 'أسعارنا',
    pricingSubtitle: 'اختر الخطة التي تناسب احتياجاتك وابدأ اليوم',
    
    // Contact
    contactTitle: 'اتصل بنا',
    contactSubtitle: 'نحن هنا لمساعدتك. لا تتردد في الاتصال بنا لأي سؤال أو اقتراح',
  },
  fr: {
    // Navigation
    home: 'Accueil',
    services: 'Services',
    pricing: 'Tarifs',
    contact: 'Contact',
    bookings: 'Réservations',
    admin: 'Admin',
    profile: 'Profil',
    login: 'Se connecter',
    register: "S'inscrire",
    loginRegister: "Se connecter / S'inscrire",
    logout: 'Se déconnecter',
    
    // Common
    search: 'Rechercher',
    filter: 'Filtres',
    all: 'Tous',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    
    // Service related
    postService: 'Publier votre service',
    findServices: 'Trouver des services',
    serviceType: 'Type de service',
    onSite: 'Sur site',
    online: 'En ligne',
    category: 'Catégorie',
    location: 'Lieu',
    
    // Homepage
    popularServices: 'Services Populaires',
    popularServicesSubtitle: 'Découvrez nos services les plus demandés',
    sameDayService: '✓ Service le jour même disponible',
    loadingServices: 'Chargement des services...',
    noServicesAvailable: 'Aucun service disponible pour le moment',
    viewAllServices: 'Voir tous les services',
    
    onlineExperts: 'Experts en ligne et Freelancers',
    onlineExpertsSubtitle: 'Connectez-vous avec des professionnels expérimentés en ligne',
    browseFreelancers: 'Parcourir les Freelancers',
    
    howItWorks: 'Comment ça fonctionne',
    howItWorksSubtitle: 'Étapes simples pour obtenir votre service',
    step1Title: 'Réserver un service',
    step1Description: 'Choisissez le service dont vous avez besoin et sélectionnez votre créneau préféré',
    step2Title: 'Obtenez une correspondance',
    step2Description: 'Nous vous mettrons en relation avec un professionnel qualifié près de chez vous',
    step3Title: 'Service terminé',
    step3Description: 'Le professionnel arrive et termine le travail à votre satisfaction',
    
    testimonials: 'Ce que disent nos clients',
    testimonialsSubtitle: 'Fait confiance par des milliers de personnes à travers la Tunisie',
    
    topProfessionals: 'Nos meilleurs professionnels',
    topProfessionalsSubtitle: 'Rencontrez quelques-uns de nos prestataires de services les mieux notés',
    jobsCompleted: 'travaux terminés',
    
    readyToStart: 'Prêt à commencer ?',
    readyToStartSubtitle: 'Rejoignez des milliers de clients satisfaits à travers la Tunisie qui font confiance à ServiGo pour leurs besoins de services à domicile',
    bookNow: 'Réserver maintenant',
    joinAsProfessional: 'Rejoindre en tant que professionnel',
    tunisianOwned: 'Propriété et exploitation tunisiennes',
    paymentMethods: 'Paiement: Espèces | Flouci',
    
    // Hero section
    heroTitle: 'Trouvez les meilleurs prestataires de services en Tunisie',
    heroSubtitle: 'Découvrez et réservez des services de qualité auprès de professionnels certifiés dans votre région',
    
    // Pricing
    pricingTitle: 'Nos Tarifs',
    pricingSubtitle: 'Choisissez le plan qui correspond à vos besoins et commencez dès aujourd\'hui',
    
    // Contact
    contactTitle: 'Contactez-nous',
    contactSubtitle: 'Nous sommes là pour vous aider. N\'hésitez pas à nous contacter pour toute question ou suggestion',
  },
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    pricing: 'Pricing',
    contact: 'Contact',
    bookings: 'Bookings',
    admin: 'Admin',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',
    loginRegister: 'Login / Register',
    logout: 'Logout',
    
    // Common
    search: 'Search',
    filter: 'Filters',
    all: 'All',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    
    // Service related
    postService: 'Post Your Service',
    findServices: 'Find Services',
    serviceType: 'Service Type',
    onSite: 'On-site',
    online: 'Online',
    category: 'Category',
    location: 'Location',
    
    // Homepage
    popularServices: 'Popular Services',
    popularServicesSubtitle: 'Discover our most requested services',
    sameDayService: '✓ Same-day service available',
    loadingServices: 'Loading services...',
    noServicesAvailable: 'No services available yet',
    viewAllServices: 'View All Services',
    
    onlineExperts: 'Online Experts & Freelancers',
    onlineExpertsSubtitle: 'Connect with Experienced Online Professionals',
    browseFreelancers: 'Browse Freelancers',
    
    howItWorks: 'How It Works',
    howItWorksSubtitle: 'Easy steps to get your service',
    step1Title: 'Book a Service',
    step1Description: 'Choose the service you need and select your preferred time slot',
    step2Title: 'Get Matched',
    step2Description: "We'll connect you with a skilled professional near you",
    step3Title: 'Service Completed',
    step3Description: 'The professional arrives and completes the job to your satisfaction',
    
    testimonials: 'What Our Customers Say',
    testimonialsSubtitle: 'Trusted by thousands across Tunisia',
    
    topProfessionals: 'Our Top Professionals',
    topProfessionalsSubtitle: 'Meet some of our highly-rated service providers',
    jobsCompleted: 'jobs completed',
    
    readyToStart: 'Ready to get started?',
    readyToStartSubtitle: 'Join thousands of satisfied customers across Tunisia who trust ServiGo for their home service needs',
    bookNow: 'Book Now',
    joinAsProfessional: 'Join as a Professional',
    tunisianOwned: 'Tunisian Owned & Operated',
    paymentMethods: 'Payment: Cash | Flouci',
    
    // Hero section
    heroTitle: 'Find the Best Service Providers in Tunisia',
    heroSubtitle: 'Discover and book quality services from certified professionals in your area',
    
    // Pricing
    pricingTitle: 'Our Pricing',
    pricingSubtitle: 'Choose the plan that fits your needs and get started today',
    
    // Contact
    contactTitle: 'Contact Us',
    contactSubtitle: 'We\'re here to help. Feel free to reach out with any questions or suggestions',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('selectedLanguage', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  }, [language]);

  // Load saved language on mount
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && ['ar', 'fr', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};