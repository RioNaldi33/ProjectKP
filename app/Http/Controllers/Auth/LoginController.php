<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RealRashid\SweetAlert\Facades\Alert;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = '/';


    protected function attemptLogin(Request $request)
    {
        $credentials = $this->credentials($request);
        // Tambahan: Periksa apakah pengguna aktif atau tidak
        $user = $this->guard()->getProvider()->retrieveByCredentials($credentials);

        if ($user && !$user->isActive()) {
            // Pengguna tidak aktif, berikan respons sesuai keinginan Anda
            return false;

        }
        return $this->guard()->attempt(
            $this->credentials($request), $request->boolean('remember')
        );
    }
    protected function sendFailedLoginResponse(Request $request)
    {
        $credentials = $this->credentials($request);
        // Tambahan: Periksa apakah pengguna aktif atau tidak
        $user = $this->guard()->getProvider()->retrieveByCredentials($credentials);

        if ($user && !$user->isActive()) {
            // Pengguna tidak aktif, berikan respons sesuai keinginan Anda
            throw ValidationException::withMessages([
                $this->username() => "Akun Belum Aktif",
            ]);
        } else {
            throw ValidationException::withMessages([
                $this->username() => "Email Atau Password Salah",
            ]);
        }

    }

    /*protected function sendFailedLoginResponse(Request $request)
    {
        throw ValidationException::withMessages([
            $this->username() => [trans('auth.failed')],
        ])->status(422);
    }

    protected function authenticated(Request $request, $user)
    {
        if (!$user->isActive()) {
            // User is not active, show SweetAlert
            Alert::error('Gagal', 'Akun belum diaktifkan')->persistent(true, true);

            // Logout the user
            $this->guard()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login');
        }

        // User is active, continue with the normal authenticated logic
        // ...

    }*/

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except('logout');
    }
}
