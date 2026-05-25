<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RouteKeyResolver
{
    public static function resolveEventId(string $routeKey): ?string
    {
        $value = trim($routeKey);
        if ($value === '') {
            return null;
        }

        return DB::table('events')
            ->where('id', $value)
            ->orWhere('slug', $value)
            ->value('id');
    }

    public static function resolveOrganizationId(string $routeKey): ?string
    {
        $value = trim($routeKey);
        if ($value === '') {
            return null;
        }

        return DB::table('organizations')
            ->where('id', $value)
            ->orWhere('slug', $value)
            ->value('id');
    }

    public static function uniqueSlug(string $table, string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source);
        if ($base === '') {
            $base = 'item';
        }

        $slug = $base;
        $suffix = 2;

        while (self::slugExists($table, $slug, $ignoreId)) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    private static function slugExists(string $table, string $slug, ?string $ignoreId = null): bool
    {
        $query = DB::table($table)->where('slug', $slug);

        if ($ignoreId !== null && $ignoreId !== '') {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }
}
