// Service categorization utility
export interface ServiceCategory {
  id: string;
  name: string;
  type: 'onsite' | 'online';
  description?: string;
}

// Define which categories are on-site vs online
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // On-site services
  { id: 'plumbing', name: 'Plumbing', type: 'onsite', description: 'Water systems, pipes, and fixtures' },
  { id: 'electrical', name: 'Electrical', type: 'onsite', description: 'Electrical installations and repairs' },
  { id: 'carpentry', name: 'Carpentry', type: 'onsite', description: 'Wood work and furniture' },
  { id: 'painting', name: 'Painting', type: 'onsite', description: 'Interior and exterior painting' },
  { id: 'cleaning', name: 'Cleaning', type: 'onsite', description: 'House and office cleaning' },
  { id: 'gardening', name: 'Gardening', type: 'onsite', description: 'Landscaping and maintenance' },
  { id: 'photography', name: 'Photography', type: 'onsite', description: 'Event and portrait photography' },
  { id: 'catering', name: 'Catering', type: 'onsite', description: 'Food services for events' },
  { id: 'transportation', name: 'Transportation', type: 'onsite', description: 'Moving and delivery' },
  
  // Online services  
  { id: 'tutoring', name: 'Tutoring', type: 'online', description: 'Educational and academic support' },
  { id: 'web-development', name: 'Web Development', type: 'online', description: 'Website and app development' },
  { id: 'graphic-design', name: 'Graphic Design', type: 'online', description: 'Visual design and branding' },
  { id: 'digital-marketing', name: 'Digital Marketing', type: 'online', description: 'Online marketing and SEO' },
  { id: 'writing', name: 'Writing', type: 'online', description: 'Content writing and copywriting' },
  { id: 'translation', name: 'Translation', type: 'online', description: 'Language translation services' },
  { id: 'consulting', name: 'Consulting', type: 'online', description: 'Business and technical consulting' },
];

export const getServiceType = (categoryName: string): 'onsite' | 'online' | 'unknown' => {
  const category = SERVICE_CATEGORIES.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.type || 'unknown';
};

export const getOnSiteCategories = () => 
  SERVICE_CATEGORIES.filter(cat => cat.type === 'onsite');

export const getOnlineCategories = () => 
  SERVICE_CATEGORIES.filter(cat => cat.type === 'online');

export const isOnSiteService = (categoryName: string): boolean => 
  getServiceType(categoryName) === 'onsite';

export const isOnlineService = (categoryName: string): boolean => 
  getServiceType(categoryName) === 'online';