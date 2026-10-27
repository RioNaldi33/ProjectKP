@extends('landing_page.partials.master')
@section('content')
    <h6 class="mt-5" id="testParagraf" style="background-color:#0AE77B; color:white;">Aji Bayu Permadi</h6>
    <button onclick="rubahBackground()">gaskan</button>
@endsection
@push('addon-script')
    <script>
        function rubahBackground() {
            console.log('ngotak dek')
            let heading = document.getElementById('testParagraf')
            console.log(heading);

            heading.style.backgroundColor = "#ffffff"
        }
    </script>
@endpush
