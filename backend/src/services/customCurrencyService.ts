import { PrismaClient, CustomCurrency } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const CustomCurrencySchema = z.object({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  exchangeRate: z.number().positive().max(999999.999999),
});

export const CustomCurrencyUpdateSchema = CustomCurrencySchema.partial();

export type CustomCurrencyInput = z.infer<typeof CustomCurrencySchema>;
export type CustomCurrencyUpdateInput = z.infer<typeof CustomCurrencyUpdateSchema>;

export class CustomCurrencyService {
  static async createCustomCurrency(userId: string, data: CustomCurrencyInput): Promise<CustomCurrency> {
    // Check if code already exists for this user
    const existingCurrency = await prisma.customCurrency.findFirst({
      where: {
        userId,
        code: data.code,
      },
    });

    if (existingCurrency) {
      throw new Error(`Currency with code ${data.code} already exists`);
    }

    // If this is set as default, unset other defaults for this user
    if (data.isDefault) {
      await prisma.customCurrency.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return prisma.customCurrency.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async getUserCustomCurrencies(userId: string): Promise<CustomCurrency[]> {
    return prisma.customCurrency.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  static async getCustomCurrencyById(currencyId: string, userId: string): Promise<CustomCurrency | null> {
    return prisma.customCurrency.findFirst({
      where: {
        id: currencyId,
        userId,
      },
    });
  }

  static async updateCustomCurrency(
    currencyId: string,
    userId: string,
    data: CustomCurrencyUpdateInput
  ): Promise<CustomCurrency> {
    // Check if currency exists and belongs to user
    const existingCurrency = await this.getCustomCurrencyById(currencyId, userId);
    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // If updating code, check for conflicts
    if (data.code && data.code !== existingCurrency.code) {
      const codeConflict = await prisma.customCurrency.findFirst({
        where: {
          userId,
          code: data.code,
          id: { not: currencyId },
        },
      });

      if (codeConflict) {
        throw new Error(`Currency with code ${data.code} already exists`);
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.customCurrency.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: currencyId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return prisma.customCurrency.update({
      where: {
        id: currencyId,
      },
      data,
    });
  }

  static async deleteCustomCurrency(currencyId: string, userId: string): Promise<void> {
    // Check if currency exists and belongs to user
    const existingCurrency = await this.getCustomCurrencyById(currencyId, userId);
    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // Check if this currency is being used in user preferences
    const userPreferences = await prisma.userPreferences.findFirst({
      where: {
        userId,
        customCurrencyId: currencyId,
      },
    });

    if (userPreferences) {
      throw new Error('Cannot delete currency that is currently in use. Please change your currency preference first.');
    }

    await prisma.customCurrency.delete({
      where: {
        id: currencyId,
      },
    });
  }

  static async setDefaultCurrency(currencyId: string, userId: string): Promise<CustomCurrency> {
    // Check if currency exists and belongs to user
    const existingCurrency = await this.getCustomCurrencyById(currencyId, userId);
    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // Unset all other defaults for this user
    await prisma.customCurrency.updateMany({
      where: {
        userId,
        isDefault: true,
        id: { not: currencyId },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this currency as default
    return prisma.customCurrency.update({
      where: {
        id: currencyId,
      },
      data: {
        isDefault: true,
      },
    });
  }

  static async getDefaultCurrency(userId: string): Promise<CustomCurrency | null> {
    return prisma.customCurrency.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true,
      },
    });
  }

  static async convertAmount(
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    userId: string
  ): Promise<number> {
    const fromCurrency = await this.getCustomCurrencyById(fromCurrencyId, userId);
    const toCurrency = await this.getCustomCurrencyById(toCurrencyId, userId);

    if (!fromCurrency || !toCurrency) {
      throw new Error('One or both currencies not found');
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / Number(fromCurrency.exchangeRate);
    return usdAmount * Number(toCurrency.exchangeRate);
  }

  static getBuiltInCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    ];
  }
}
