import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Macros, FoodItem, MealSuggestion, DailyGoal } from "../types";
import { getMealWindows } from "../utils/timeUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MACRO_SCHEMA_PROPS = {
  calories: { type: Type.NUMBER, description: "Total calories in kcal" },
  protein: { type: Type.NUMBER, description: "Protein in grams" },
  carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
  fat: { type: Type.NUMBER, description: "Fat in grams" },
};

const FOOD_ITEM_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the food item" },
      ...MACRO_SCHEMA_PROPS,
    },
    required: ["name", "calories", "protein", "carbs", "fat"],
  },
};

/**
 * Parses a free-text food log into structured data.
 */
export const parseFoodLog = async (text: string): Promise<FoodItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following food log and extract nutritional information: "${text}". Estimate portion sizes if not specified.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_ITEM_SCHEMA,
        systemInstruction: "You are a precise nutrition assistant. Your goal is to accurately estimate calories and macros from free-text food logs.",
      },
    });

    const data = JSON.parse(response.text || "[]");
    
    // Add IDs and timestamps
    return data.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }));

  } catch (error) {
    console.error("Error parsing food log:", error);
    throw new Error("Failed to process food log. Please try again.");
  }
};

/**
 * Analyzes an image to identify food items and nutritional content.
 */
export const analyzeFoodImage = async (base64Data: string, mimeType: string): Promise<FoodItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this image. Identify all food items visible, estimate their portion sizes, and calculate total calories and macros. Return a JSON array."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_ITEM_SCHEMA,
        systemInstruction: "You are an expert nutritionist with computer vision capabilities. Identify food visually, estimate portion sizes based on standard dishware, and calculate nutrition facts.",
      },
    });

    const data = JSON.parse(response.text || "[]");
    
    return data.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }));

  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image.");
  }
};

/**
 * Generates an adaptive meal plan based on specific strict macro targets.
 */
export const generateAdaptivePlan = async (
  consumed: Macros,
  goals: DailyGoal,
  currentTime: Date,
  customInstruction?: string,
  numberOfMeals?: number
): Promise<MealSuggestion[]> => {
  
  const remaining = {
    calories: Math.max(0, goals.calories - consumed.calories),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat),
  };

  // Determine number of meals based on logic
  let mealStrategy = "";
  if (numberOfMeals) {
    mealStrategy = `Create exactly ${numberOfMeals} meal(s) that fit the remaining intake.`;
  } else if (remaining.calories < 400) {
    mealStrategy = "Create 1 small meal/snack.";
  } else if (remaining.calories < 900) {
    mealStrategy = "Create 1 medium meal.";
  } else {
    mealStrategy = "Create 2-3 meals.";
  }

  const mealWindows = getMealWindows(currentTime.getHours());

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      meals: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            mealType: { type: Type.STRING, description: "Suggested label based on time (Breakfast, Lunch, Dinner, Snack)" },
            description: { type: Type.STRING, description: "Short appetizing description" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  grams: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER }
                },
                required: ["name", "grams", "protein", "fat", "carbs", "calories"]
              }
            },
            totals: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                calories: { type: Type.NUMBER }
              },
              required: ["protein", "fat", "carbs", "calories"]
            },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternative: { type: Type.STRING }
          },
          required: ["name", "mealType", "description", "ingredients", "totals", "instructions", "alternative"]
        }
      }
    }
  };

  const prompt = `
    You are a nutrition engine.
    Your job is to generate meals that perfectly hit a user’s remaining daily calories and macros.

    INPUT:
    - calories_left: ${Math.round(remaining.calories)}
    - protein_left: ${Math.round(remaining.protein)}
    - fat_left: ${Math.round(remaining.fat)}
    - carbs_left: ${Math.round(remaining.carbs)}
    - current_time: ${currentTime.toLocaleTimeString()}
    - suggested_windows: ${mealWindows.join(", ")}
    ${customInstruction ? `- IMPORTANT USER TWEAK/INSTRUCTION: "${customInstruction}". adjust the generated meals to fit this request while still hitting macros.` : ''}

    RULES:
    1. ${mealStrategy}
    2. Meals must match remaining macros within:
       - ±5% calories
       - ±8% protein/fat/carbs
    3. Every meal must include exact gram weights for ingredients.
    4. Allowed ingredients: lean meats, eggs, fish, veggies, rice, potatoes, oats, fruit, nut butters, greek yogurt, tofu, beans, bread, pasta. No exotic ingredients.
    5. Label the 'mealType' logically based on the current time (e.g. if it's 6pm, suggest Dinner).

    Output the 'meals' array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const meals = parsed.meals || [];

    // Map the new strict structure to our app's flattened structure
    return meals.map((meal: any) => ({
      name: meal.name,
      mealType: meal.mealType,
      description: meal.description,
      ingredients: meal.ingredients, // Now passing the detailed object array
      instructions: meal.instructions,
      alternative: meal.alternative,
      // Flatten totals to root for compatibility
      calories: meal.totals.calories,
      protein: meal.totals.protein,
      carbs: meal.totals.carbs,
      fat: meal.totals.fat
    }));

  } catch (error) {
    console.error("Error generating plan:", error);
    throw new Error("Failed to generate meal plan.");
  }
};