---
description: Design specifications for the Project Management and Ticketing System based on reference images.
---

# Design Specifications: Omni-PMS & Ticketing

This document outlines the visual and interaction design based on the provided reference images. The goal is a clean, "human-centric" professional workspace.

## 1. Color Palette
- **Primary Background**: `#F8FAFC` (Light Slate/Gray)
- **Secondary Background/Sidebar**: `#FFFFFF`
- **Primary Accent (Brand)**: `#6366F1` (Indigo) with `#8B5CF6` (Violet) gradients
- **Accent Cards**:
  - Workspace Overview: Linear gradient `(to right, #6366F1, #8B5CF6)`
  - Quote Card: `#1E293B` (Dark Slate)
- **Status Colors**:
  - High Priority: `#EF4444` (Red)
  - Medium: `#F59E0B` (Amber)
  - Low: `#3B82F6` (Blue)
  - Success: `#10B981` (Emerald)

## 2. Typography
- **Core Font**: 'Outfit' or 'Inter', sans-serif.
- **Headers**: Semi-bold to Bold, neutral dark `#1E293B`.
- **Body**: Regular, `#475569`.
- **Subtext/Labels**: `#94A3B8`.

## 3. Component Architecture

### Layout
- **Sidebar (Fixed Left)**: White background, thin border `#E2E8F0`. Features navigation links with subtle icons.
- **Main Content**: Slate background with padding.
- **Global Header**: Breadcrumbs and search bar.

### Dashboard Widgets (Image 1)
- **Hero Card**: Large, purple gradient. Shows "Workspace Overview", completion %, and quick stats.
- **Workload Chart**: Donut chart showing distribution.
- **Quick Action Grid**: 4 small cards with icons and labels.
- **Activity Feed**: List of recent events with avatars.
- **Quote Card**: Dark card with "Focus on being productive instead of busy."

### Kanban Board (Image 2)
- **Columns**: "To-do", "In Progress", "In Review", "Completed".
- **Task Cards**: 
  - White background, light border.
  - Category tags (Bug, Design, Feature) with colored backgrounds.
  - Avatar stack for team members.
  - Date and message count icons.

### Modals (Image 3 & 4)
- **Search Overlay**: Elevated, centered, clean input, categorized results.
- **Tag Manager**: Clean form with color swatches.

## 4. Interaction Principles
- **Transitions**: 150ms-250ms ease-in-out.
- **Hover States**: Subtle scale-up (101%) or darkening of background.
- **Shadows**: Soft, multi-layered shadows for elevation. `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Borders**: Rounded corners `1rem` for major cards, `0.5rem` for inputs/buttons.
