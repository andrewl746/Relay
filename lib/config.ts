import raw from '../config.json' with { type: 'json' }

export type Config = typeof raw

/**
 * The only place domain vocabulary enters the program. A pivot that changes who
 * the users are should be a diff against config.json plus a reseed.
 */
export const config: Config = raw

/** Cycle boundaries as Date objects, in ascending order. */
export const boundaries = config.cycleBoundaries.map((d) => new Date(d))

export const timelineStart = boundaries[0]
export const timelineEnd = boundaries[boundaries.length - 1]
