import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Determine which subdomain we're on
  let subdomain: 'careers' | 'admin' | 'verify' = 'careers';

  if (hostname.startsWith('admin.') || hostname.includes('admin.ujjwalit')) {
    subdomain = 'admin';
  } else if (hostname.startsWith('verify.') || hostname.includes('verify.ujjwalit')) {
    subdomain = 'verify';
  } else if (hostname.startsWith('careers.') || hostname.includes('careers.ujjwalit')) {
    subdomain = 'careers';
  }

  // Dev: allow ?subdomain= query param for local testing
  const urlSubdomain = request.nextUrl.searchParams.get('subdomain');
  if (urlSubdomain === 'admin' || urlSubdomain === 'verify' || urlSubdomain === 'careers') {
    subdomain = urlSubdomain;
  }

  // Skip rewriting for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') // static files
  ) {
    return updateSupabaseSession(request);
  }

  // Rewrite to the correct route group
  const url = request.nextUrl.clone();

  // Admin auth check
  if (subdomain === 'admin') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // If not authenticated, force to /admin/login
    if (!user) {
      if (pathname !== '/login' && pathname !== '/admin/login') {
        url.pathname = '/admin/login';
        return NextResponse.rewrite(url);
      }
    } else {
      // If authenticated and trying to access login or root, redirect to dashboard
      if (pathname === '/login' || pathname === '/admin/login' || pathname === '/') {
        url.pathname = '/admin/dashboard';
        return NextResponse.rewrite(url);
      }
    }
  }

  // Map routes based on subdomain (using folders careers/admin/verify)
  if (subdomain === 'careers') {
    if (!pathname.startsWith('/careers')) {
      url.pathname = `/careers${pathname === '/' ? '' : pathname}`;
    }
  } else if (subdomain === 'verify') {
    if (!pathname.startsWith('/verify')) {
      url.pathname = `/verify${pathname === '/' ? '' : pathname}`;
    }
  } else if (subdomain === 'admin') {
    if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    }
  }

  const response = NextResponse.rewrite(url);
  return updateSupabaseSessionWithResponse(request, response);
}

async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  return updateSupabaseSessionWithResponse(request, response);
}

async function updateSupabaseSessionWithResponse(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
