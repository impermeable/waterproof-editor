import { ThemeStyle } from "./api";

let currentTheme: ThemeStyle = "light";

export function setCurrentTheme(theme: ThemeStyle) {
	currentTheme = theme;
}

export function getCurrentTheme(): ThemeStyle{
	return currentTheme;
}