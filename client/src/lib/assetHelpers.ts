export interface MediaAsset {
    assetType: 'POSTER' | 'THUMBNAIL' | 'SUBTITLE';
    variant: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' | 'BANNER';
    language: string;
    url: string;
}

export interface AssetEntity {
    assets?: MediaAsset[];
    languagePrimary?: string;
    title?: string;
}

/**
 * Resolves the correct Poster URL for a Program/Entity based on variant and language context.
 * Priority:
 * 1. Exact match (variant + requested language)
 * 2. Primary match (variant + primary language)
 * 3. Fallback match (variant + any language) - Use with caution
 */
export function getProgramPoster(
    program: AssetEntity,
    variant: 'PORTRAIT' | 'LANDSCAPE',
    languageContext?: string
): string | null {
    if (!program || !program.assets) return null;

    const targetLang = languageContext || program.languagePrimary;

    // 1. Exact Match
    const exact = program.assets.find(a =>
        a.assetType === 'POSTER' &&
        a.variant === variant &&
        a.language === targetLang
    );
    if (exact?.url) return exact.url;

    // 2. Primary Language Fallback (if we requested a different language)
    if (targetLang !== program.languagePrimary) {
        const primary = program.assets.find(a =>
            a.assetType === 'POSTER' &&
            a.variant === variant &&
            a.language === program.languagePrimary
        );
        if (primary?.url) return primary.url;
    }

    return null;
}

/**
 * Resolves the correct Thumbnail URL for a Lesson based on variant and language context.
 */
export function getLessonThumbnail(
    lesson: AssetEntity,
    variant: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE',
    languageContext?: string
): string | null {
    if (!lesson || !lesson.assets) return null;

    const targetLang = languageContext || lesson.languagePrimary;

    // 1. Exact Match
    const exact = lesson.assets.find(a =>
        a.assetType === 'THUMBNAIL' &&
        a.variant === variant &&
        a.language === targetLang
    );
    if (exact?.url) return exact.url;

    // 2. Primary Fallback
    if (targetLang !== lesson.languagePrimary) {
        const primary = lesson.assets.find(a =>
            a.assetType === 'THUMBNAIL' &&
            a.variant === variant &&
            a.language === lesson.languagePrimary
        );
        if (primary?.url) return primary.url;
    }

    // 3. Any Variant Fallback (Soft Fallback mechanism if specific variant missing but others exist? No, user wants strictness)
    // User said: "Publishing must be blocked if required variants are missing" -> implies strictness.
    // However for display, if we ask for Portrait but only have Landscape, do we show nothing?
    // User said "Do not auto-crop images". So we should return null and let UI show placeholder.

    return null;
}
