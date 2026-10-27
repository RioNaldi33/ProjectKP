<?php

namespace App\Http\Controllers;

use App\Models\EMufassir\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use RealRashid\SweetAlert\Facades\Alert;

/**
 * DonationController
 *
 * Mengelola halaman dan proses donasi.
 * - index() : Halaman daftar donatur
 * - store() : Proses penyimpanan donasi baru
 */
class DonationController extends Controller
{
    /**
     * Halaman donasi: Menampilkan daftar donatur dan total donasi.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $donatur     = Donation::all()->sortDesc();
        $countDonasi = $donatur->pluck('nominal')->sum();

        return view('landing_page.layout.donation', compact('donatur', 'countDonasi'));
    }

    /**
     * Menyimpan data donasi baru dan mengirim ke API admin.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'name'         => 'required',
            'account_name' => 'required',
            'nominal'      => 'required',
            'photo'        => 'required|image|max:1024|mimes:jpeg,png,jpg',
        ]);

        if ($validator->fails()) {
            Alert::error('Gagal', 'Mengirim Submit Bukti');
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Kirim data ke API admin
        $validateData = $request->all();
        $url = env('API_ADMIN_URL') . 'donation';

        try {
            $response = Http::attach(
                'photo',
                file_get_contents($request->file('photo')->getRealPath()),
                $request->file('photo')->getClientOriginalName()
            )->post($url, [
                'name'         => $validateData['name'],
                'account_name' => $validateData['account_name'],
                'nominal'      => $validateData['nominal'],
            ]);

            $result = $response->json();

            if ($result['error']) {
                Alert::error('Gagal', $result['message']);
            } else {
                Alert::success('Berhasil', 'Terima Kasih Telah Berdonasi');
            }
        } catch (\Exception $e) {
            Alert::error('Gagal', $e->getMessage());
        }

        return redirect()->back();
    }
}
