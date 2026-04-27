export interface UserProfile {
  name: string
  age: number
  sex: 'male' | 'female'
  weight: number
  height: number
  bodyFat: number
  goal: 'weight_loss' | 'muscle_gain' | 'recomposition' | 'maintenance'
  dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'antiinflammatory'
  ketosis: boolean
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  trainingType: 'strength' | 'cardio' | 'mixed' | 'yoga_pilates' | 'rays_program' | 'none'
  trainingDays: number
  trainingTime: 'morning' | 'afternoon' | 'evening' | 'none'
  hormonal: 'none' | 'obesity' | 'perimenopause' | 'pcos' | 'insulin_resistance' | 'hypothyroidism'
  allergies: string[]
  intolerances: string[]
  mealsPerDay: number
  preferences: string
}

export interface FoodItem {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Meal {
  name: string
  time?: string
  foods: FoodItem[]
  calories: number
  protein: number
  carbs: number
  fat: number
  instructions?: string
  notes?: string
}

export interface AlternativeMeal {
  name: string
  foods: FoodItem[]
  calories: number
  protein: number
  carbs: number
  fat: number
  instructions: string
}

export interface DayPlan {
  day: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  meals: Meal[]
  alternativeLunch?: AlternativeMeal
  notes?: string
}

export interface ShoppingCategory {
  category: string
  items: string[]
}

export interface MealPlan {
  userName: string
  generatedAt: string
  weekNumber: number
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  bmr: number
  tdee: number
  days: DayPlan[]
  shoppingList: ShoppingCategory[]
  tips: string[]
  hydration: string
  supplementation?: string[]
  hormonalNotes?: string
  notes: string
}

export interface CheckInData {
  userName: string
  week: number
  currentWeight: number
  energyLevel: number
  adherence: number
  digestion: number
  sleep: number
  notes: string
  successes: string
}
