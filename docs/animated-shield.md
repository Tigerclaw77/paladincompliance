# Animated Paladin Shield

The reusable shield animation lives in:

- `src/components/AnimatedPaladinShield.tsx`
- `public/paladin-shield-static.svg`
- `public/paladin-shield-mark.svg`

The homepage hero already uses the animated component.

## Homepage Usage

```tsx
import AnimatedPaladinShield from "@/components/AnimatedPaladinShield";

export default function HeroGraphic() {
  return (
    <AnimatedPaladinShield className="w-full max-w-[380px]" />
  );
}
```

## Dashboard Usage

Use the same component in a dark dashboard header or summary panel:

```tsx
<AnimatedPaladinShield
  className="w-48 sm:w-60"
  ariaLabel="Paladin Compliance coverage shield"
/>
```

For a quieter dashboard surface, disable animation:

```tsx
<AnimatedPaladinShield
  animated={false}
  className="w-40"
/>
```

## Static Fallback

Use `public/paladin-shield-static.svg` when animation is not appropriate. Use
`public/paladin-shield-mark.svg` when the mark needs to sit on an existing dark
surface without its own background.

The component also respects `prefers-reduced-motion: reduce` and stops the glow,
shimmer, haze, and particle motion automatically.
