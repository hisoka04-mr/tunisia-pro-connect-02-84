import { supabase } from "@/integrations/supabase/client";

export const seedJobCategories = async () => {
  const categories = [
    // Online Service Providers - Writing & Content Creation
    { name: "Article Writing", description: "Professional article writing services", service_type: "online" },
    { name: "Blogging", description: "Blog content creation and management", service_type: "online" },
    { name: "Copywriting", description: "Marketing and sales copy writing", service_type: "online" },
    { name: "SEO Writing", description: "Search engine optimized content writing", service_type: "online" },
    { name: "Technical Writing", description: "Technical documentation and manuals", service_type: "online" },

    // Online Service Providers - Graphic Design & Multimedia
    { name: "Logo Design", description: "Professional logo and brand identity design", service_type: "online" },
    { name: "Web Design", description: "Website design and user interface creation", service_type: "online" },
    { name: "Video Editing", description: "Professional video editing and post-production", service_type: "online" },
    { name: "3D Modeling", description: "3D modeling and rendering services", service_type: "online" },
    { name: "UI/UX Design", description: "User interface and experience design", service_type: "online" },

    // Online Service Providers - Photography & Videography
    { name: "Photo Editing", description: "Professional photo editing and retouching", service_type: "online" },
    { name: "Product Photography", description: "Commercial product photography", service_type: "online" },
    { name: "Stock Photography", description: "Stock photo creation and licensing", service_type: "online" },

    // Online Service Providers - Music & Audio Production
    { name: "Voice Over", description: "Professional voice over services", service_type: "online" },
    { name: "Sound Design", description: "Audio design and sound effects creation", service_type: "online" },
    { name: "Music Composition", description: "Original music composition and scoring", service_type: "online" },
    { name: "Podcast Production", description: "Podcast editing and production services", service_type: "online" },

    // Online Service Providers - Translation & Transcription
    { name: "Document Translation", description: "Professional document translation services", service_type: "online" },
    { name: "Audio Transcription", description: "Audio to text transcription services", service_type: "online" },
    { name: "Subtitling", description: "Video subtitling and captioning services", service_type: "online" },

    // Online Service Providers - Tech & Development
    { name: "Web Development", description: "Website and web application development", service_type: "online" },
    { name: "Mobile App Development", description: "iOS and Android app development", service_type: "online" },
    { name: "Software Development", description: "Custom software development services", service_type: "online" },
    { name: "Cybersecurity", description: "Cybersecurity consulting and services", service_type: "online" },
    { name: "Data Analysis & AI", description: "Data analysis and AI development services", service_type: "online" },

    // Online Service Providers - Marketing & Sales
    { name: "Digital Marketing", description: "SEO, PPC, and digital marketing services", service_type: "online" },
    { name: "Social Media Management", description: "Social media strategy and management", service_type: "online" },
    { name: "Affiliate Marketing", description: "Affiliate marketing and promotion services", service_type: "online" },
    { name: "Brand Strategy", description: "Brand development and strategy consulting", service_type: "online" },

    // Online Service Providers - Consulting
    { name: "Business Consulting", description: "Business strategy and consulting services", service_type: "online" },
    { name: "HR Consulting", description: "Human resources consulting and services", service_type: "online" },
    { name: "Legal Consulting", description: "Legal advice and consulting services", service_type: "online" },
    { name: "Financial Consulting", description: "Financial planning and consulting services", service_type: "online" },

    // Online Service Providers - Education & Tutoring
    { name: "Online Tutoring", description: "Remote tutoring and educational support", service_type: "online" },
    { name: "Course Creation", description: "Online course development and creation", service_type: "online" },
    { name: "Career Coaching", description: "Career development and coaching services", service_type: "online" },

    // Online Service Providers - Administrative Services
    { name: "Virtual Assistant", description: "Remote administrative assistance services", service_type: "online" },
    { name: "Data Entry", description: "Data entry and processing services", service_type: "online" },
    { name: "Customer Support", description: "Remote customer support services", service_type: "online" },

    // Online Service Providers - Health & Wellness
    { name: "Nutrition Consulting", description: "Online nutrition counseling and meal planning", service_type: "online" },
    { name: "Personal Training", description: "Online personal training and fitness coaching", service_type: "online" },
    { name: "Mental Health Counseling", description: "Online mental health counseling services", service_type: "online" },

    // Onsite Service Providers - Trades & Construction
    { name: "Plumbing", description: "Plumbing installation and repair services", service_type: "onsite" },
    { name: "Electrical Services", description: "Electrical installation and repair services", service_type: "onsite" },
    { name: "HVAC Services", description: "Heating, ventilation, and air conditioning services", service_type: "onsite" },
    { name: "Carpentry", description: "Wood working and carpentry services", service_type: "onsite" },
    { name: "Painting & Decorating", description: "Interior and exterior painting services", service_type: "onsite" },

    // Onsite Service Providers - Cleaning & Maintenance
    { name: "House Cleaning", description: "Residential cleaning and maintenance services", service_type: "onsite" },
    { name: "Office Cleaning", description: "Commercial office cleaning services", service_type: "onsite" },
    { name: "Carpet Cleaning", description: "Professional carpet cleaning services", service_type: "onsite" },
    { name: "Pressure Washing", description: "Exterior pressure washing services", service_type: "onsite" },

    // Onsite Service Providers - Landscaping & Gardening
    { name: "Lawn Care", description: "Lawn mowing and maintenance services", service_type: "onsite" },
    { name: "Gardening", description: "Garden design and maintenance services", service_type: "onsite" },
    { name: "Tree Trimming", description: "Tree trimming and removal services", service_type: "onsite" },

    // Onsite Service Providers - Pest Control
    { name: "Pest Extermination", description: "General pest control and extermination", service_type: "onsite" },
    { name: "Rodent Control", description: "Rodent control and prevention services", service_type: "onsite" },
    { name: "Termite Inspection", description: "Termite inspection and treatment services", service_type: "onsite" },

    // Onsite Service Providers - Personal Services
    { name: "Haircutting & Styling", description: "Professional hair cutting and styling services", service_type: "onsite" },
    { name: "Makeup Artist", description: "Professional makeup and beauty services", service_type: "onsite" },
    { name: "Manicure/Pedicure", description: "Nail care and beauty services", service_type: "onsite" },

    // Onsite Service Providers - Event Planning & Coordination
    { name: "Weddings", description: "Wedding planning and coordination services", service_type: "onsite" },
    { name: "Corporate Events", description: "Corporate event planning and management", service_type: "onsite" },
    { name: "Party Planning", description: "Party and celebration planning services", service_type: "onsite" },

    // Onsite Service Providers - Transportation & Delivery
    { name: "Moving Services", description: "Residential and commercial moving services", service_type: "onsite" },
    { name: "Chauffeur Services", description: "Professional chauffeur and driving services", service_type: "onsite" },
    { name: "Parcel Delivery", description: "Package and parcel delivery services", service_type: "onsite" },

    // Onsite Service Providers - Healthcare & Medical
    { name: "Home Healthcare", description: "In-home healthcare and medical services", service_type: "onsite" },
    { name: "Nursing Services", description: "Professional nursing and care services", service_type: "onsite" },
    { name: "Physical Therapy", description: "In-home physical therapy services", service_type: "onsite" },

    // Onsite Service Providers - Legal & Administrative
    { name: "Notary Public", description: "Notary public and document authentication", service_type: "onsite" },
    { name: "Legal Advice", description: "In-person legal consultation services", service_type: "onsite" },
    { name: "Document Filing", description: "Legal document filing and processing", service_type: "onsite" },

    // Onsite Service Providers - Fitness & Personal Training
    { name: "Personal Trainer", description: "In-person personal training services", service_type: "onsite" },
    { name: "Yoga Instructor", description: "Yoga instruction and classes", service_type: "onsite" },
    { name: "Pilates Instructor", description: "Pilates instruction and classes", service_type: "onsite" },
  ];

  try {
    // Check if categories already exist to avoid duplicates
    const { data: existingCategories } = await supabase
      .from("job_categories")
      .select("name");

    const existingNames = existingCategories?.map(cat => cat.name) || [];
    
    // Filter out categories that already exist
    const newCategories = categories.filter(cat => !existingNames.includes(cat.name));

    if (newCategories.length === 0) {
      console.log("All categories already exist in the database");
      return { success: true, message: "All categories already exist" };
    }

    // Insert new categories
    const { data, error } = await supabase
      .from("job_categories")
      .insert(newCategories)
      .select();

    if (error) {
      console.error("Error inserting job categories:", error);
      return { success: false, error };
    }

    console.log(`Successfully added ${newCategories.length} new job categories:`, data);
    return { success: true, data, count: newCategories.length };
  } catch (error) {
    console.error("Error seeding job categories:", error);
    return { success: false, error };
  }
};