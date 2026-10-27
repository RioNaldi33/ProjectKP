@extends('landing_page.partials.master')

@section('content')
    <!-- Login Section Section Starts Here -->
    <div class="login-section">
        <div class=" container">
            <div class="account-wrapper">
                <h3 class="title font-poppins">Login</h3>
                <form class="account-form" method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="form-group">
                        <input type="text" placeholder="Email" name="email"
                            class="form-control @error('email') is-invalid @enderror">
                        @error('email')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                            @php
                                alert()->error('Gagal', $message);
                            @endphp
                        @enderror
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" name="password"
                            class="form-control @error('email') is-invalid @enderror">
                        @error('password')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                            @php
                                alert()->error('Gagal', $message);
                            @endphp
                        @enderror
                    </div>
                    <div class="form-group">
                        <button class="d-block lab-btn"><span>Submit Now</span></button>
                    </div>
                </form>
                <div class="account-bottom">
                    <span class="d-block cate pt-10">Don’t Have any Account? <a href="http://admin.e-mufassir.com/register">
                            Sign
                            Up</a></span>
                </div>
            </div>
        </div>
    </div>
    @include('sweetalert::alert')
    <!-- Login Section Section Ends Here -->
@endsection
