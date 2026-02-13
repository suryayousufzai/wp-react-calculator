'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CalculatorSelections,
  QuoteResult,
  QuoteFormData,
  SubmitStatus,
} from '../types/calculator';
import {
  calculateQuote,
  fetchWordPressConfig,
  submitQuoteToWordPress,
  SERVICE_CATEGORIES,
} from '../utils/calculator';

export function useCalculator() {
  // User's current selections
  const [selections, setSelections] = useState<CalculatorSelections>({});

  // Calculated quote (updates live as selections change)
  const quote = useMemo<QuoteResult | null>(() => {
    const hasSelections = Object.values(selections).some((s) => s.length > 0);
    if (!hasSelections) return null;
    return calculateQuote(selections);
  }, [selections]);

  // WordPress config loaded from API
  const [wpConfig, setWpConfig] = useState<{
    currency: string;
    discount_threshold: number;
    discount_percentage: number;
  } | null>(null);

  const [configLoading, setConfigLoading] = useState<boolean>(true);

  // Quote submission state
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Current step in the calculator flow
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = SERVICE_CATEGORIES.length;

  // Load WordPress config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchWordPressConfig();
        setWpConfig(config);
      } catch {
        console.error('Failed to load WordPress config');
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Toggle a selection for a category
  const toggleSelection = useCallback(
    (categoryId: string, optionId: string, multiSelect: boolean) => {
      setSelections((prev) => {
        const current = prev[categoryId] || [];

        if (multiSelect) {
          // Multi-select: toggle the option
          const newSelections = current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId];
          return { ...prev, [categoryId]: newSelections };
        } else {
          // Single-select: replace the selection
          const newSelections = current[0] === optionId ? [] : [optionId];
          return { ...prev, [categoryId]: newSelections };
        }
      });
    },
    []
  );

  // Check if an option is selected
  const isSelected = useCallback(
    (categoryId: string, optionId: string): boolean => {
      return (selections[categoryId] || []).includes(optionId);
    },
    [selections]
  );

  // Reset all selections
  const resetCalculator = useCallback(() => {
    setSelections({});
    setCurrentStep(0);
    setSubmitStatus('idle');
    setSubmitMessage('');
    setSubmissionId(null);
  }, []);

  // Navigate steps
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Count total selected options
  const totalSelected = useMemo(() => {
    return Object.values(selections).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
  }, [selections]);

  // Submit quote to WordPress
  const submitQuote = useCallback(
    async (formData: QuoteFormData) => {
      if (!quote) return;

      setSubmitStatus('submitting');
      setSubmitMessage('');

      try {
        const result = await submitQuoteToWordPress(formData, quote);
        setSubmitStatus('success');
        setSubmitMessage(result.message);
        setSubmissionId(result.submissionId);
      } catch (err) {
        setSubmitStatus('error');
        setSubmitMessage(
          err instanceof Error ? err.message : 'Submission failed. Please try again.'
        );
      }
    },
    [quote]
  );

  return {
    selections,
    quote,
    wpConfig,
    configLoading,
    currentStep,
    totalSteps,
    totalSelected,
    submitStatus,
    submitMessage,
    submissionId,
    toggleSelection,
    isSelected,
    resetCalculator,
    nextStep,
    prevStep,
    submitQuote,
  };
}
