<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentsSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'College of Arts and Sciences', 'code' => 'CAS'],
            ['name' => 'College of Engineering', 'code' => 'CE'],
            ['name' => 'College of Computer Studies', 'code' => 'CCS'],
            ['name' => 'College of Business and Entrepreneurship', 'code' => 'CBE'],
            ['name' => 'College of Education', 'code' => 'CEduc'],
            ['name' => 'College of Nursing', 'code' => 'CN'],
            ['name' => 'College of Criminal Justice', 'code' => 'CCJ'],
            ['name' => 'College of Agriculture, Food Technology, and Nutrition', 'code' => 'CAFTN'],
        ];

        foreach ($departments as $d) {
            DB::table('departments')->updateOrInsert(['code' => $d['code']], $d + ['created_at' => now(), 'updated_at' => now()]);
        }
    }
}
