"use client";

import { useId, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import darkStyles from "./TimePicker.module.css";
import lightStyles from "./TimePicker.light.module.css";

// Extend dayjs to support parsing standard 'hh:mm A' formats
dayjs.extend(customParseFormat);

type TimePickerProps = {
  label?: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minTime?: string;
  theme?: "dark" | "light";
  validateTime?: (value: string) => boolean;
};

export default function TimePicker({
  label,
  ariaLabel,
  value,
  onChange,
  disabled = false,
  minTime,
  theme = "dark",
  validateTime,
}: TimePickerProps) {
  const styles = theme === "light" ? lightStyles : darkStyles;
  const popoverId = useId();

  // Create a customized Material UI theme configured for dark / light modes
  const muiTheme = useMemo(() => {
    const isDark = theme === "dark";
    return createTheme({
      palette: {
        mode: isDark ? "dark" : "light",
        primary: {
          main: "#e53b17", // Brand brand-accent/pomegranate color
        },
        background: {
          default: isDark ? "#121212" : "#ffffff",
          paper: isDark ? "#1a1a1a" : "#ffffff",
        },
        text: {
          primary: isDark ? "rgba(255, 255, 255, 0.95)" : "var(--ink)",
          secondary: isDark ? "rgba(255, 255, 255, 0.55)" : "var(--scorpion)",
        },
      },
      typography: {
        fontFamily: "var(--font-body)",
        button: {
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          textTransform: "uppercase",
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid var(--mercury)",
              borderRadius: "12px",
              boxShadow: isDark
                ? "0 16px 40px rgba(0, 0, 0, 0.45)"
                : "0 16px 40px color-mix(in srgb, var(--ink) 12%, transparent)",
            },
          },
        },
      },
    });
  }, [theme]);

  // Parse value string to dayjs instance
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const parsed = dayjs(value, "hh:mm A");
    return parsed.isValid() ? parsed : null;
  }, [value]);

  // Parse minTime string to dayjs instance
  const parsedMinTime = useMemo(() => {
    if (!minTime) return null;
    const parsed = dayjs(minTime, "hh:mm A");
    return parsed.isValid() ? parsed : null;
  }, [minTime]);

  // Perform validation matching existing criteria
  const hasError = useMemo(() => {
    if (!parsedValue) return false;

    // 1. Minimum time boundary check
    if (parsedMinTime && parsedValue.isBefore(parsedMinTime)) {
      return true;
    }

    // 2. Custom conflict validation
    if (validateTime) {
      const formatted = parsedValue.format("hh:mm A");
      if (!validateTime(formatted)) {
        return true;
      }
    }

    return false;
  }, [parsedValue, parsedMinTime, validateTime]);

  const handleTimeChange = (newValue: dayjs.Dayjs | null, context?: any) => {
    if (newValue === null) {
      onChange("");
    } else if (newValue.isValid()) {
      let resolvedValue = newValue;
      if (!value && context?.source !== "view") {
        resolvedValue = newValue.minute(0).second(0);
      }
      onChange(resolvedValue.format("hh:mm A"));
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`${styles.timePicker} ${disabled ? styles.timePickerDisabled : ""}`}>
      {label && <label className={styles.timePickerLabel}>{label}</label>}
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DesktopTimePicker
            value={parsedValue}
            onChange={handleTimeChange}
            disabled={disabled}
            minTime={parsedMinTime || undefined}
            referenceDate={dayjs().startOf("day")}
            localeText={{
              fieldHoursPlaceholder: () => "00",
              fieldMinutesPlaceholder: () => "00",
              fieldMeridiemPlaceholder: () => "AM",
            }}
            slotProps={{
              desktopPaper: {
                sx: {
                  "& .MuiMultiSectionDigitalClockSection-root": {
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  },
                  "& .MuiMenuItem-root, & .MuiMultiSectionDigitalClock-option, & .MuiListItemButton-root": {
                    "&:hover:not(.Mui-selected)": {
                      backgroundColor: "transparent !important",
                    },
                  },
                },
              },
              textField: {
                id: popoverId,
                size: "small",
                error: hasError,
                helperText: hasError
                  ? parsedMinTime && parsedValue?.isBefore(parsedMinTime)
                    ? "Must be at least 30 mins after start"
                    : "Time conflict with another slot"
                  : undefined,
                slotProps: {
                  htmlInput: {
                    "aria-label": ariaLabel,
                  },
                },
                sx: {
                  width: "148px",
                  "& .MuiPickersOutlinedInput-root": {
                    height: "42px",
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    color: isDark ? "var(--white)" : "var(--ink)",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "var(--white)",
                    borderRadius: "0px",
                    transition: "border-color 0.2s ease, background-color 0.2s ease",
                    "& .MuiPickersOutlinedInput-notchedOutline": {
                      borderColor: isDark ? "var(--border-chip)" : "var(--mercury)",
                      borderRadius: "0px",
                    },
                    "&:hover": {
                      "& .MuiPickersOutlinedInput-notchedOutline": {
                        borderColor: `${isDark ? "var(--border-chip)" : "var(--mercury)"} !important`,
                      },
                    },
                    "&.Mui-focused": {
                      backgroundColor: (isDark ? "rgba(255, 255, 255, 0.03)" : "var(--white)") + " !important",
                      boxShadow: !isDark
                        ? "0 0 0 3px color-mix(in srgb, var(--pomegranate) 10%, transparent)"
                        : "none",
                      "& .MuiPickersOutlinedInput-notchedOutline": {
                        borderColor: `${isDark ? "rgba(255, 255, 255, 0.18)" : "var(--pomegranate)"} !important`,
                        borderWidth: "1px",
                      },
                    },
                    "&.Mui-focused:hover .MuiPickersOutlinedInput-notchedOutline": {
                      borderColor: `${isDark ? "rgba(255, 255, 255, 0.18)" : "var(--pomegranate)"} !important`,
                    },
                    "&.Mui-error .MuiPickersOutlinedInput-notchedOutline": {
                      borderColor: "#e53b17 !important",
                    },
                  },
                  "& .MuiPickersOutlinedInput-input": {
                    padding: "0 12px",
                    fontFamily: "var(--font-body)",
                    height: "42px",
                    boxSizing: "border-box",
                  },
                  "& .MuiIconButton-root": {
                    color: isDark ? "rgba(255, 255, 255, 0.55)" : "var(--silver-chalice)",
                    padding: "4px",
                    marginRight: "4px",
                    "&:hover": {
                      color: isDark ? "var(--white)" : "var(--ink)",
                      backgroundColor: "transparent",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#e53b17 !important",
                    margin: "4px 0 0 0",
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "max-content",
                    zIndex: 5,
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </ThemeProvider>
    </div>
  );
}

export function getTimePickerMinutes(value: string): number {
  if (!value) return 0;
  const parsed = dayjs(value, "hh:mm A");
  if (!parsed.isValid()) return 0;
  return parsed.hour() * 60 + parsed.minute();
}
