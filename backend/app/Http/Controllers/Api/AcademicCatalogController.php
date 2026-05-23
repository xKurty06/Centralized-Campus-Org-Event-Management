<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class AcademicCatalogController extends Controller
{
    public function departments()
    {
        $departments = DB::table('departments')
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $departments,
        ], 200);
    }

    public function courses()
    {
        $courses = DB::table('courses')
            ->select([
                'id',
                'dept_id',
                'course_code as code',
                'course_name as name',
            ])
            ->orderBy('course_code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courses,
        ], 200);
    }
}
