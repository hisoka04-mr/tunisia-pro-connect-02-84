import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorizedSkillsSelectorProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}

const SKILL_CATEGORIES = {
  "Web Development": [
    "HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Angular", 
    "Node.js", "PHP", "Python", "Django", "Laravel", "WordPress", "Shopify",
    "Frontend Development", "Backend Development", "Full Stack Development"
  ],
  "Mobile Development": [
    "React Native", "Flutter", "iOS Development", "Android Development",
    "Kotlin", "Swift", "Xamarin", "Ionic", "Cordova"
  ],
  "Design": [
    "Graphic Design", "UI/UX Design", "Logo Design", "Branding", "Illustration",
    "Adobe Photoshop", "Adobe Illustrator", "Figma", "Sketch", "Canva",
    "Web Design", "Print Design", "Brand Identity"
  ],
  "Digital Marketing": [
    "SEO", "SEM", "Google Ads", "Facebook Ads", "Social Media Marketing",
    "Content Marketing", "Email Marketing", "Affiliate Marketing", "Influencer Marketing",
    "Google Analytics", "Marketing Strategy", "Lead Generation"
  ],
  "Content Creation": [
    "Content Writing", "Copywriting", "Blog Writing", "Technical Writing",
    "Creative Writing", "Proofreading", "Editing", "Ghostwriting",
    "Social Media Content", "Video Scripts"
  ],
  "Translation": [
    "Arabic Translation", "French Translation", "English Translation",
    "German Translation", "Spanish Translation", "Italian Translation",
    "Localization", "Proofreading", "Interpreting"
  ],
  "Video & Audio": [
    "Video Editing", "Audio Editing", "Animation", "Motion Graphics",
    "Adobe Premiere", "After Effects", "Final Cut Pro", "Audacity",
    "Voice Over", "Podcast Production"
  ],
  "Data & Analytics": [
    "Data Entry", "Data Analysis", "Excel", "Google Sheets", "SQL",
    "Power BI", "Tableau", "Python", "R", "Statistical Analysis",
    "Market Research", "Data Visualization"
  ],
  "IT & Tech Support": [
    "Technical Support", "IT Consulting", "System Administration",
    "Network Setup", "Cloud Services", "AWS", "Azure", "Linux",
    "Windows Server", "Cybersecurity", "Software Installation"
  ],
  "Business & Finance": [
    "Virtual Assistant", "Project Management", "Business Consulting",
    "Financial Planning", "Accounting", "Bookkeeping", "Tax Preparation",
    "CRM Management", "Business Analysis", "Process Improvement"
  ],
  "Education & Training": [
    "Online Tutoring", "Course Creation", "Educational Content",
    "Training Materials", "E-learning", "Curriculum Development",
    "Academic Writing", "Research", "Presentation Skills"
  ]
};

const CategorizedSkillsSelector = ({ value, onChange, placeholder = "Search and select skills..." }: CategorizedSkillsSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  
  const filteredSkills = searchValue 
    ? allSkills.filter(skill => 
        skill.toLowerCase().includes(searchValue.toLowerCase()) &&
        !value.includes(skill)
      )
    : allSkills.filter(skill => !value.includes(skill));

  const handleSelectSkill = (skill: string) => {
    if (!value.includes(skill)) {
      onChange([...value, skill]);
    }
    setSearchValue("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(value.filter(skill => skill !== skillToRemove));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !value.includes(customSkill.trim())) {
      onChange([...value, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const getCategoryForSkill = (skill: string) => {
    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      if (skills.includes(skill)) {
        return category;
      }
    }
    return null;
  };

  const groupedFilteredSkills = filteredSkills.reduce((groups: Record<string, string[]>, skill) => {
    const category = getCategoryForSkill(skill);
    if (category) {
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
    }
    return groups;
  }, {});

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Skills & Tools
      </Label>
      
      {/* Skills selector dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between text-left font-normal"
          >
            {placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search skills..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-64">
              <CommandEmpty>No skills found.</CommandEmpty>
              {Object.entries(groupedFilteredSkills).map(([category, skills]) => (
                <CommandGroup key={category} heading={category}>
                  {skills.slice(0, 5).map((skill) => (
                    <CommandItem
                      key={skill}
                      onSelect={() => {
                        handleSelectSkill(skill);
                        setIsOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(skill) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {skill}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Custom skill input */}
      <div className="flex gap-2">
        <Input
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          placeholder="Add custom skill or tool"
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSkill())}
        />
        <Button 
          type="button" 
          onClick={handleAddCustomSkill} 
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected skills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => handleRemoveSkill(skill)}
            >
              {skill} ✕
            </Badge>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Select skills from categories or add custom skills that match your expertise
        </p>
      )}
    </div>
  );
};

export default CategorizedSkillsSelector;