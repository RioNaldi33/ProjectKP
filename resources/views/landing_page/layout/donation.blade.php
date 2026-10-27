{{--
|--------------------------------------------------------------------------
| Halaman Donasi
|--------------------------------------------------------------------------
|
| Halaman untuk menerima dan menampilkan donasi.
| Terdiri dari: QR/Rekening, Form donasi, dan Daftar donatur.
|
--}}

@extends('landing_page.partials.master')

@section('content')
    {{-- Header --}}
    <div class="container-donasi text-center mb-5">
        <h3 class="font-poppins">Donasi</h3>
    </div>

    <div class="donasi-layout row justify-content-center mb-5 gap-3">
        {{-- ============================================================
             INFORMASI REKENING
             ============================================================ --}}
        <div class="col-lg-3 col-md-6 col-sm-8 text-center">
            <div class="p-4" style="border: 1px solid #c2e4be">
                <img class="mb-5" src="{{ url('assets/images/Bank_Syariah_Indonesia.svg.png') }}"
                    alt="Logo BSI" width="250">
                <p class="font-costum fw-bold">Elvino Dwi Saputra - 7173225614</p>
                <p class="font-costum">Bank Syariah Indonesia</p>
                <button class="btn-rekening font-costum" onclick="salin(this)" data-ayat="7173225614">Salin</button>
            </div>
        </div>

        {{-- ============================================================
             FORM DONASI
             ============================================================ --}}
        <div class="col-lg-3 col-md-6 col-sm-8">
            <div class="p-3" style="border: 1px solid #c2e4be">
                <h6 class="font-poppins">Silahkan isi data ini donasi</h6>
                <p class="mb-4" style="font-size: 10px">
                    *isi data dilakukan jika setelah melakukan transfer ke nomor rekening di samping
                </p>

                <form action="{{ route('add-donation') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="mb-3">
                        <label for="name" class="form-label input-donasi">* Nama Donatur</label>
                        <input class="form-control input-donasi" type="text" name="name" id="name" placeholder="Nama">
                    </div>
                    <div class="mb-3">
                        <label class="input-donasi form-label" style="font-size: 0.6rem">Ganti nama menjadi Hamba Sahaya</label><br>
                        <input class="form-check-input me-1" type="checkbox" name="name" id="nameCheckbox" value="Hamba Sahaya">
                        <label class="form-check-label" for="nameCheckbox" style="font-size: 0.7rem">Hamba Sahaya</label>
                    </div>
                    <div class="mb-3">
                        <label for="account_name" class="form-label input-donasi">* Nama Rekening Pengirim</label>
                        <input class="form-control input-donasi" type="text" name="account_name" id="account_name"
                            placeholder="Nama Rekening Pengirim">
                    </div>
                    <div class="mb-3">
                        <label for="nominal" class="form-label input-donasi">* Nominal</label>
                        <input class="form-control input-donasi" type="number" name="nominal" id="nominal" placeholder="Nominal">
                    </div>
                    <div class="mb-3">
                        <label for="photo" class="form-label input-donasi">* Bukti Transfer</label>
                        <input class="form-control input-donasi" type="file" name="photo">
                    </div>
                    <div>
                        <button type="submit" class="btn btn-primary form-control">Kirim</button>
                    </div>
                </form>
            </div>
        </div>

        {{-- ============================================================
             INFO & DAFTAR DONATUR
             ============================================================ --}}
        <div class="col-lg-3 col-md-6 col-sm-8">
            {{-- Pesan Donasi --}}
            <div class="p-3" style="border: 1px solid #c2e4be">
                <h5 class="font-poppins mb-3 text-center">🙌 Assalamualaikum</h5>
                <p class="font-costum justify-text">
                    Bagi temen-temen yang ingin ikut berdonasi untuk pengembangan website ini
                    yang insya Allah akan mengalir juga pahala bagi yang membacanya, bisa melalui website ini.
                </p>
                <p class="font-costum justify-text">
                    Jazakumullah khairan, terimakasih telah menggunakan
                    <a style="text-decoration: none; color: black" href="https://www.e-mufassir.com">
                        <strong>Quran E-Mufassir</strong>
                    </a>,
                    semoga Allah senantiasa menambahkan ilmu agama pada diri kita.
                </p>
                <p class="font-costum">
                    <strong>Total Donasi</strong> : Rp.{{ number_format($countDonasi, 0, ',', '.') }}
                </p>
            </div>

            {{-- Daftar Donatur --}}
            <h6 class="font-poppins text-center my-3">Donatur</h6>
            <div class="donatur overflow-scroll p-2" style="height: 50vh;">
                @if ($donatur->isNotEmpty())
                    @foreach ($donatur as $data)
                        <div class="d-flex mb-3 gap-3 p-2">
                            <img src="https://source.boringavatars.com/beam/45/{{ $data->name }}?colors=8DC63F,2BB573,189692,82C5D6,16DE11"
                                alt="Avatar {{ $data->name }}">
                            <p class="font-costum">
                                <strong>{{ $data->name }}</strong> baru saja memberikan donasi
                                <strong>Rp.{{ number_format($data->nominal, 0, ',', '.') }}</strong>
                            </p>
                        </div>
                    @endforeach
                @else
                    <div class="text-center">
                        <p class="font-costum">Donatur Belum Ada 😊</p>
                    </div>
                @endif
            </div>
        </div>
    </div>

    @include('sweetalert::alert')
@endsection
