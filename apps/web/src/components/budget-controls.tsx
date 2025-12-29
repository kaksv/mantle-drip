"use client";

import { useState, useEffect } from "react";
import { useTreasury } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BUDGET_STORAGE_KEY = "drip-treasury-budgets";

interface Budget {
  token: string;
  monthlyLimit: number;
  yearlyLimit: number;
}

export function BudgetControls() {
  const { outflowProjections, tokenBalances } = useTreasury();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [yearlyLimit, setYearlyLimit] = useState("");

  // Load budgets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (stored) {
      try {
        setBudgets(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load budgets", e);
      }
    }
  }, []);

  // Save budgets to localStorage
  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(newBudgets));
  };

  const handleSetBudget = (token: string) => {
    const monthly = parseFloat(monthlyLimit);
    const yearly = parseFloat(yearlyLimit);

    if (isNaN(monthly) || monthly <= 0) {
      toast.error("Please enter a valid monthly limit");
      return;
    }

    if (isNaN(yearly) || yearly <= 0) {
      toast.error("Please enter a valid yearly limit");
      return;
    }

    const existingIndex = budgets.findIndex((b) => b.token === token);
    const newBudget: Budget = { token, monthlyLimit: monthly, yearlyLimit: yearly };

    let newBudgets: Budget[];
    if (existingIndex >= 0) {
      newBudgets = [...budgets];
      newBudgets[existingIndex] = newBudget;
    } else {
      newBudgets = [...budgets, newBudget];
    }

    saveBudgets(newBudgets);
    setEditingToken(null);
    setMonthlyLimit("");
    setYearlyLimit("");
    toast.success("Budget limit set successfully");
  };

  const handleRemoveBudget = (token: string) => {
    const newBudgets = budgets.filter((b) => b.token !== token);
    saveBudgets(newBudgets);
    toast.success("Budget limit removed");
  };

  const tokens = Object.keys(outflowProjections.monthly);
  const monthlyOutflow = outflowProjections.monthly;
  const yearlyOutflow = outflowProjections.yearly;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Spending Limits & Budget Controls
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set monthly and yearly spending limits to monitor treasury health
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {tokens.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No active payments to set budgets for
          </p>
        ) : (
          tokens.map((token) => {
            const monthlyProjected = monthlyOutflow[token]?.amount || 0;
            const yearlyProjected = yearlyOutflow[token]?.amount || 0;
            const budget = budgets.find((b) => b.token === token);
            const isOverMonthly = budget && monthlyProjected > budget.monthlyLimit;
            const isOverYearly = budget && yearlyProjected > budget.yearlyLimit;
            const monthlyPercent = budget
              ? (monthlyProjected / budget.monthlyLimit) * 100
              : 0;
            const yearlyPercent = budget
              ? (yearlyProjected / budget.yearlyLimit) * 100
              : 0;

            return (
              <div
                key={token}
                className="p-4 rounded-lg border bg-background/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {monthlyOutflow[token]?.symbol || "Token"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Projected: {monthlyProjected.toFixed(4)} / month,{" "}
                      {yearlyProjected.toFixed(2)} / year
                    </p>
                  </div>
                  {budget && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBudget(token)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {budget ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Monthly Limit</span>
                        <span
                          className={`text-sm font-medium ${
                            isOverMonthly ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {monthlyProjected.toFixed(4)} / {budget.monthlyLimit.toFixed(4)} (
                          {monthlyPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isOverMonthly
                              ? "bg-destructive"
                              : monthlyPercent > 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
                        />
                      </div>
                      {isOverMonthly && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          Monthly limit exceeded!
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Yearly Limit</span>
                        <span
                          className={`text-sm font-medium ${
                            isOverYearly ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {yearlyProjected.toFixed(2)} / {budget.yearlyLimit.toFixed(2)} (
                          {yearlyPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isOverYearly
                              ? "bg-destructive"
                              : yearlyPercent > 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(yearlyPercent, 100)}%` }}
                        />
                      </div>
                      {isOverYearly && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          Yearly limit exceeded!
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingToken(token);
                        setMonthlyLimit(budget.monthlyLimit.toString());
                        setYearlyLimit(budget.yearlyLimit.toString());
                      }}
                    >
                      Edit Budget
                    </Button>
                  </div>
                ) : (
                  <div>
                    {editingToken === token ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Monthly Limit</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="0.0"
                              value={monthlyLimit}
                              onChange={(e) => setMonthlyLimit(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Yearly Limit</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.0"
                              value={yearlyLimit}
                              onChange={(e) => setYearlyLimit(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSetBudget(token)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingToken(null);
                              setMonthlyLimit("");
                              setYearlyLimit("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingToken(token)}
                      >
                        Set Budget Limit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

