<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VenuesSeeder extends Seeder
{
    public function run(): void
    {
        $venues = [
            'Rolle Hall',
            'ICON',
            'Quadrangle',
            'Grandstand',
            'Campus Oval',
            'Softball Field',
            'Open Court',
            'Gymnasium',
            'Hostel',
            'Administration',
            'University Chapel',
            'Bahay ng Alumni',
            'International House',
            'Laya\'t Diwa',
            'University Resort',
        ];

        foreach ($venues as $name) {
            DB::table('venues')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}