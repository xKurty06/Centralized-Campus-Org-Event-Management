<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VenuesSeeder extends Seeder
{
    public function run(): void
    {
        $venues = [
            'SMT Hall', 'AVR 1', 'AVR 2', 'Gymnasium', 'Function Hall', 'Open Grounds', 'Library Conference Room', 'CCS Laboratory', 'Engineering Building'
        ];

        foreach ($venues as $name) {
            DB::table('venues')->updateOrInsert(['name' => $name], ['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
