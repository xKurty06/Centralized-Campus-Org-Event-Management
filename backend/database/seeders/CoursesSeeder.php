<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoursesSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            // CEIT - College of Engineering and Information Technology
            ['department_code' => 'CEIT', 'code' => 'BSABE', 'name' => 'Bachelor of Science in Agricultural and Biosystems Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSARCH', 'name' => 'Bachelor of Science in Architecture'],
            ['department_code' => 'CEIT', 'code' => 'BSCE', 'name' => 'Bachelor of Science in Civil Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSCOE', 'name' => 'Bachelor of Science in Computer Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science'],
            ['department_code' => 'CEIT', 'code' => 'BSEE', 'name' => 'Bachelor of Science in Electrical Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSECE', 'name' => 'Bachelor of Science in Electronics Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSIE', 'name' => 'Bachelor of Science in Industrial Engineering'],
            ['department_code' => 'CEIT', 'code' => 'BSINDT', 'name' => 'Bachelor of Science in Industrial Technology'],
            ['department_code' => 'CEIT', 'code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology'],

            // CEMDS - College of Economics, Management and Development Studies
            ['department_code' => 'CEMDS', 'code' => 'BSOA', 'name' => 'Bachelor of Science in Office Administration'],
            ['department_code' => 'CEMDS', 'code' => 'BSACC', 'name' => 'Bachelor of Science in Accountancy'],
            ['department_code' => 'CEMDS', 'code' => 'BSBA', 'name' => 'BS Business Administration'],
            ['department_code' => 'CEMDS', 'code' => 'BSECON', 'name' => 'BS Economics'],
            ['department_code' => 'CEMDS', 'code' => 'BSDM', 'name' => 'BS Development Management'],
            ['department_code' => 'CEMDS', 'code' => 'BSIS', 'name' => 'BS International Studies'],

            // CAS - College of Arts and Sciences
            ['department_code' => 'CAS', 'code' => 'BACOMM', 'name' => 'Bachelor of Arts in Communication'],
            ['department_code' => 'CAS', 'code' => 'BSDEVCOM', 'name' => 'Bachelor of Science in Development Communication'],
            ['department_code' => 'CAS', 'code' => 'BSBIO', 'name' => 'Bachelor of Science in Biology'],
            ['department_code' => 'CAS', 'code' => 'BAJOURN', 'name' => 'Bachelor of Arts in Journalism'],
            ['department_code' => 'CAS', 'code' => 'BAELS', 'name' => 'Bachelor of Arts in English Language Studies'],
            ['department_code' => 'CAS', 'code' => 'BSPSYCH', 'name' => 'Bachelor of Science in Psychology'],
            ['department_code' => 'CAS', 'code' => 'BAPS', 'name' => 'Bachelor of Arts in Political Science'],
            ['department_code' => 'CAS', 'code' => 'BSSW', 'name' => 'Bachelor of Science in Social Work'],
            ['department_code' => 'CAS', 'code' => 'BSAM', 'name' => 'Bachelor of Science in Applied Mathematics'],

            // CON - College of Nursing
            ['department_code' => 'CON', 'code' => 'BSN', 'name' => 'Bachelor of Science in Nursing'],
            ['department_code' => 'CON', 'code' => 'BSMT', 'name' => 'Bachelor of Science in Medical Technology / Medical Laboratory Science'],
            ['department_code' => 'CON', 'code' => 'BSM', 'name' => 'Bachelor of Science in Midwifery'],
            ['department_code' => 'CON', 'code' => 'DIPMID', 'name' => 'Diploma in Midwifery'],

            // CVMBS - College of Veterinary Medicine and Biomedical Sciences
            ['department_code' => 'CVMBS', 'code' => 'DVM', 'name' => 'Doctor of Veterinary Medicine'],
            ['department_code' => 'CVMBS', 'code' => 'BSVTECH', 'name' => 'BS Veterinary Technology'],
            ['department_code' => 'CVMBS', 'code' => 'BSAHM', 'name' => 'BS Animal Health and Management'],
            ['department_code' => 'CVMBS', 'code' => 'BSBIOMED', 'name' => 'BS Biomedical Science'],
            ['department_code' => 'CVMBS', 'code' => 'MVST', 'name' => 'Master in Veterinary Studies'],
            ['department_code' => 'CVMBS', 'code' => 'MVSC', 'name' => 'Master in Veterinary Science'],

            // CTHM - College of Tourism and Hospitality Management
            ['department_code' => 'CTHM', 'code' => 'BSHM', 'name' => 'Bachelor of Science in Hospitality Management'],
            ['department_code' => 'CTHM', 'code' => 'BSTM', 'name' => 'Bachelor of Science in Tourism Management'],

            // CCJ - College of Criminal Justice
            ['department_code' => 'CCJ', 'code' => 'BSCRIM', 'name' => 'Bachelor of Science in Criminology'],
            ['department_code' => 'CCJ', 'code' => 'BSISA', 'name' => 'Bachelor of Science in Industrial Security Administration'],

            // CSPEAR - College of Sports, Physical Education and Recreation
            ['department_code' => 'CSPEAR', 'code' => 'BPE', 'name' => 'Bachelor of Physical Education'],
            ['department_code' => 'CSPEAR', 'code' => 'BSESS', 'name' => 'Bachelor of Exercise and Sports Sciences'],

            // CAFENR - College of Agriculture, Food, Environment, and Natural Resources
            ['department_code' => 'CAFENR', 'code' => 'BSA', 'name' => 'BS Agriculture'],
            ['department_code' => 'CAFENR', 'code' => 'BSES', 'name' => 'BS in Environmental Science'],
            ['department_code' => 'CAFENR', 'code' => 'BSFT', 'name' => 'BS in Food Technology'],
            ['department_code' => 'CAFENR', 'code' => 'BSLUDM', 'name' => 'BS in Land Use Design and Management'],
            ['department_code' => 'CAFENR', 'code' => 'BAE', 'name' => 'Bachelor in Agricultural Entrepreneurship'],
            ['department_code' => 'CAFENR', 'code' => 'CERTAS', 'name' => 'Certificate in Agricultural Science'],

            // CED - College of Education
            ['department_code' => 'CED', 'code' => 'BEED', 'name' => 'Bachelor of Elementary Education'],
            ['department_code' => 'CED', 'code' => 'BECED', 'name' => 'Bachelor of Early Childhood Education'],
            ['department_code' => 'CED', 'code' => 'BSNED', 'name' => 'Bachelor of Special Needs Education'],
            ['department_code' => 'CED', 'code' => 'BTLED', 'name' => 'Bachelor of Technology and Livelihood Education'],
            ['department_code' => 'CED', 'code' => 'BSED', 'name' => 'Bachelor of Secondary Education'],

            // COM - College of Medicine
            ['department_code' => 'COM', 'code' => 'MD', 'name' => 'Doctor of Medicine'],
        ];

        foreach ($courses as $c) {
            // Find the auto-increment integer ID from the departments table matching the string code
            $deptId = DB::table('departments')->where('code', $c['department_code'])->value('id');

            if ($deptId) {
                // Let the database handle the 1, 2, 3 auto-increment natively
                DB::table('courses')->updateOrInsert(
                    ['course_code' => $c['code']],
                    [
                        'course_name' => $c['name'],
                        'dept_id'     => $deptId,
                        'created_at'  => now(),
                        'updated_at'  => now()
                    ]
                );
            }
        }
    }
}
