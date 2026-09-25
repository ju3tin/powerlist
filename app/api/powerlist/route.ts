import { NextResponse } from 'next/server'

const POWERLIST_URL =
  'https://ww2.innovatefinance.com/wp-json/custom/profiles-api?limit=-1&page=3&tax_term=wif-2025-standout-45&order=asc&orderby=title'

type PowerlistProfile = {
  id: number
  title: string
  artist_title?: string
  featured_image?: string
  link?: string
  social_icons?: Array<{ icon_type: string; social_network_url: string }>
}

function normalize(value: string) {
  try {
    const url = new URL(decodeURIComponent(value).trim())
    return url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '')
  } catch {
    return decodeURIComponent(value).trim().toLowerCase().split(/[?#]/)[0].replace(/\/$/, '')
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkedin = searchParams.get('linkedin')

  try {
    const response = await fetch(POWERLIST_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Powerlist service unavailable' }, { status: 502 })
    }

    const payload = (await response.json()) as PowerlistProfile[] | { data?: PowerlistProfile[] }
    const safeProfiles = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : []

    if (!linkedin) {
      return NextResponse.json({ profiles: safeProfiles })
    }

    const requested = normalize(linkedin)
    const profile = safeProfiles.find((candidate) =>
      candidate.social_icons?.some(
        (social) => social.icon_type === 'linkedin' && normalize(social.social_network_url) === requested,
      ),
    )

    return NextResponse.json({
      eligible: Boolean(profile),
      profile: profile ?? null,
      badge: profile
        ? {
            name: profile.title,
            title: profile.artist_title ?? 'Women in FinTech Powerlist 2026',
            image: profile.featured_image ?? null,
            network: 'Avalanche',
          }
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Powerlist service' }, { status: 502 })
  }
}

export const dynamic = 'force-dynamic'
