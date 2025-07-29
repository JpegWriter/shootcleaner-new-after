import React, { useState, useCallback } from 'react';
import { Upload, Globe, Instagram, Facebook, Camera, ArrowRight, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { styleProfileService } from '../services/styleProfileService';
import type { OnboardingData, UserStyleProfile } from '../services/styleProfileService';

interface OnboardingProps {
  onComplete: (profile: UserStyleProfile) => void;
}

export default function OnboardingPage({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    website: '',
    socialAccounts: {
      instagram: '',
      facebook: ''
    },
    favoriteImages: []
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      setOnboardingData(prev => ({
        ...prev,
        favoriteImages: [...prev.favoriteImages, ...acceptedFiles].slice(0, 20)
      }));
    }, []),
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff']
    },
    maxFiles: 20
  });

  const handleCreateProfile = async () => {
    setIsProcessing(true);
    try {
      const profile = await styleProfileService.createStyleProfile(onboardingData);
      onComplete(profile);
    } catch (error) {
      console.error('Error creating style profile:', error);
      // Handle error - maybe show error message
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome to ShootCleaner Premium</h1>
        <p className="text-lg text-gray-300">
          Let's create your personalized AI editing profile to match your unique photography style
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-8 space-y-6">
        <h3 className="text-xl font-semibold text-white">What we'll do:</h3>
        <div className="grid gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-white">Analyze Your Style</h4>
              <p className="text-sm text-gray-400">
                We'll analyze your website and social media to understand your photography style
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-white">Learn Your Preferences</h4>
              <p className="text-sm text-gray-400">
                Upload your favorite images to help our AI understand what you love
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-white">Create Your Profile</h4>
              <p className="text-sm text-gray-400">
                Generate a personalized AI profile for smarter culling and editing
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep(2)}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
      >
        <span>Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Connect Your Online Presence</h2>
        <p className="text-gray-300">
          Share your website and social media to help us understand your style
        </p>
      </div>

      <div className="space-y-6">
        {/* Website Input */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Website</h3>
            <span className="text-sm text-gray-500">(Optional)</span>
          </div>
          <input
            type="url"
            placeholder="https://yourwebsite.com"
            value={onboardingData.website}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-400">
            We'll analyze up to 50 images from your website to understand your style
          </p>
        </div>

        {/* Social Media Inputs */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Social Media</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Instagram className="w-6 h-6 text-pink-400" />
              <input
                type="text"
                placeholder="@yourusername"
                value={onboardingData.socialAccounts.instagram}
                onChange={(e) => setOnboardingData(prev => ({
                  ...prev,
                  socialAccounts: { ...prev.socialAccounts, instagram: e.target.value }
                }))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Facebook className="w-6 h-6 text-blue-400" />
              <input
                type="text"
                placeholder="facebook.com/yourpage"
                value={onboardingData.socialAccounts.facebook}
                onChange={(e) => setOnboardingData(prev => ({
                  ...prev,
                  socialAccounts: { ...prev.socialAccounts, facebook: e.target.value }
                }))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            We'll analyze your public posts to understand your photography preferences
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Upload Your Favorite Images</h2>
        <p className="text-gray-300">
          Share up to 20 of your favorite photos to help our AI learn your style
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        } cursor-pointer`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              Drop your favorite images here
            </h3>
            <p className="text-gray-400">or click to browse</p>
          </div>
          <p className="text-sm text-gray-500">
            JPG, PNG, TIFF up to 10MB each • Maximum 20 images
          </p>
        </div>
      </div>

      {onboardingData.favoriteImages.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Uploaded Images ({onboardingData.favoriteImages.length}/20)
            </h3>
            <button
              onClick={() => setOnboardingData(prev => ({ ...prev, favoriteImages: [] }))}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {onboardingData.favoriteImages.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => setOnboardingData(prev => ({
                    ...prev,
                    favoriteImages: prev.favoriteImages.filter((_, i) => i !== index)
                  }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-white text-xs">×</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCreateProfile}
          disabled={isProcessing}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Profile...</span>
            </>
          ) : (
            <>
              <span>Create My Profile</span>
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-center space-x-4 mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {step < currentStep ? <Check className="w-6 h-6" /> : step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};
