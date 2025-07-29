// ShootCleaner Style Profile Service
import axios from 'axios';
// Note: cheerio is not available in browser environment - web scraping would be done server-side

export interface UserStyleProfile {
  id: string;
  userId: string;
  website?: string;
  socialAccounts: {
    instagram?: string;
    facebook?: string;
  };
  scrapedImages: string[];
  favoriteImages: string[];
  styleAnalysis: {
    colorPalette: string[];
    brightness: number;
    contrast: number;
    saturation: number;
    composition: string;
    mood: string;
    editingStyle: string;
  };
  preferences: {
    outputResolution: '1920x1080' | '2560x1440' | '3840x2160' | 'original';
    editingIntensity: 'subtle' | 'moderate' | 'dramatic';
    colorGrading: 'natural' | 'warm' | 'cool' | 'vintage' | 'cinematic';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingData {
  website?: string;
  socialAccounts: {
    instagram?: string;
    facebook?: string;
  };
  favoriteImages: File[];
}

class StyleProfileService {
  private readonly openAIAssistantId = 'asst_qGplgwIGY48tQ2vk44kXSVCH';

  async createStyleProfile(data: OnboardingData): Promise<UserStyleProfile> {
    try {
      console.log('Creating style profile from onboarding data...');
      
      // Step 1: Scrape website images if provided
      let scrapedImages: string[] = [];
      if (data.website) {
        scrapedImages = await this.scrapeWebsiteImages(data.website);
      }

      // Step 2: Scrape social media images
      const socialImages = await this.scrapeSocialImages(data.socialAccounts);
      scrapedImages = [...scrapedImages, ...socialImages];

      // Step 3: Process favorite images
      const favoriteImageData = await this.processFavoriteImages(data.favoriteImages);

      // Step 4: Send to OpenAI Assistant for style analysis
      const styleAnalysis = await this.analyzeUserStyle(scrapedImages, favoriteImageData);

      // Step 5: Create and save style profile
      const profile: UserStyleProfile = {
        id: crypto.randomUUID(),
        userId: 'current-user', // Replace with actual user ID
        website: data.website,
        socialAccounts: data.socialAccounts,
        scrapedImages: scrapedImages.slice(0, 100), // Limit to 100 as specified
        favoriteImages: favoriteImageData,
        styleAnalysis,
        preferences: {
          outputResolution: '1920x1080',
          editingIntensity: 'moderate',
          colorGrading: 'natural'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveStyleProfile(profile);
      return profile;

    } catch (error) {
      console.error('Error creating style profile:', error);
      throw new Error('Failed to create style profile');
    }
  }

  private async scrapeWebsiteImages(website: string): Promise<string[]> {
    try {
      const response = await axios.get(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // Note: In a real implementation, this would be done server-side
      // For demo purposes, return mock data
      const images: string[] = [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
      ];

      return images.slice(0, 50); // Limit website images
    } catch (error) {
      console.error('Error scraping website:', error);
      return [];
    }
  }

  private async scrapeSocialImages(socialAccounts: { instagram?: string; facebook?: string }): Promise<string[]> {
    // Note: Social media scraping is complex due to API restrictions
    // This is a placeholder implementation
    const images: string[] = [];
    
    // In a real implementation, you would:
    // 1. Use official APIs (Instagram Basic Display API, Facebook Graph API)
    // 2. Handle OAuth authentication
    // 3. Request appropriate permissions
    
    console.log('Social media scraping placeholder - would integrate with APIs');
    return images;
  }

  private async processFavoriteImages(favoriteImages: File[]): Promise<string[]> {
    const processedImages: string[] = [];

    for (const file of favoriteImages.slice(0, 20)) { // Limit to 20 as specified
      try {
        // Convert to base64 for storage and analysis
        const base64 = await this.fileToBase64(file);
        processedImages.push(base64);
      } catch (error) {
        console.error(`Error processing favorite image ${file.name}:`, error);
      }
    }

    return processedImages;
  }

  private async analyzeUserStyle(scrapedImages: string[], favoriteImages: string[]): Promise<UserStyleProfile['styleAnalysis']> {
    try {
      const analysisPayload = {
        scrapedImages: scrapedImages.slice(0, 20), // Limit for API
        favoriteImages,
        analysisType: 'style_profile_creation'
      };

      // Send to OpenAI Assistant
      const response = await this.callOpenAIAssistant(analysisPayload);

      return {
        colorPalette: response.colorPalette || ['#000000', '#FFFFFF'],
        brightness: response.brightness || 0,
        contrast: response.contrast || 0,
        saturation: response.saturation || 0,
        composition: response.composition || 'balanced',
        mood: response.mood || 'natural',
        editingStyle: response.editingStyle || 'minimal'
      };

    } catch (error) {
      console.error('Error analyzing user style:', error);
      // Return default style profile
      return {
        colorPalette: ['#2176FF', '#19C9C2', '#181A1B'],
        brightness: 5,
        contrast: 10,
        saturation: 0,
        composition: 'rule-of-thirds',
        mood: 'professional',
        editingStyle: 'clean'
      };
    }
  }

  private async callOpenAIAssistant(payload: any): Promise<any> {
    // Placeholder for OpenAI Assistant integration
    // This would use the actual OpenAI API with your assistant ID
    console.log('Calling OpenAI Assistant with payload:', payload);
    
    return {
      colorPalette: ['#2176FF', '#19C9C2', '#181A1B'],
      brightness: 5,
      contrast: 10,
      saturation: 0,
      composition: 'rule-of-thirds',
      mood: 'professional',
      editingStyle: 'clean'
    };
  }

  private async saveStyleProfile(profile: UserStyleProfile): Promise<void> {
    // Save to local storage or database
    localStorage.setItem('shootcleaner_style_profile', JSON.stringify(profile));
    console.log('Style profile saved successfully');
  }

  async getStyleProfile(): Promise<UserStyleProfile | null> {
    try {
      const stored = localStorage.getItem('shootcleaner_style_profile');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving style profile:', error);
      return null;
    }
  }

  async updateStyleProfile(updates: Partial<UserStyleProfile>): Promise<UserStyleProfile> {
    const existing = await this.getStyleProfile();
    if (!existing) {
      throw new Error('No existing style profile found');
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveStyleProfile(updated);
    return updated;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private isValidImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }
}

export const styleProfileService = new StyleProfileService();
