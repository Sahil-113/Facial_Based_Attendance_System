import io
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import User, Attendance
from openpyxl import Workbook
from datetime import datetime

# Home page
def home_view(request):
    return render(request, 'home.html')

# Registration page
def registration_page(request):
    return render(request, 'registration.html')

# Attendance page
def attendance_page(request):
    return render(request, 'attendance.html')


# Registration submit (expects multipart/form-data with 'userid','name' and 'image' file)
@csrf_exempt
@require_http_methods(["POST"])
def register_submit(request):
    userid = request.POST.get('userid')
    name = request.POST.get('name')
    img_file = request.FILES.get('image')

    if not userid or not name:
        return JsonResponse({'status': 'error', 'message': 'userid and name are required'}, status=400)

    if not img_file:
        return JsonResponse({'status': 'error', 'message': 'Image not received'}, status=400)

    try:
        img_bytes = img_file.read()
        user, created = User.objects.update_or_create(
            userid=userid,
            defaults={'name': name, 'image': img_bytes}
        )
        return JsonResponse({'status': 'success', 'message': 'Registration Successful'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Server error: ' + str(e)}, status=500)


# Attendance submit (expects 'userid' and 'image')
@csrf_exempt
@require_http_methods(["POST"])
def attendance_submit(request):
    userid = request.POST.get('userid')
    if not userid:
        return JsonResponse({'status': 'error', 'message': 'userid is required'}, status=400)

    img_file = request.FILES.get('image')
    if not img_file:
        return JsonResponse({'status': 'error', 'message': 'Image not received'}, status=400)

    # Read captured image bytes
    captured_bytes = img_file.read()

    # Find registered user (if exists)
    try:
        user = User.objects.filter(userid=userid).first()
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'DB error: ' + str(e)}, status=500)

    # Create attendance record with Pending status; compare logic placeholder
    attendance = Attendance.objects.create(
        user=user,
        capture_image=captured_bytes,
        status='Pending'
    )

    # Placeholder for compare logic:
    # Fetch registered image bytes if user exists
    registered_bytes = user.image if user else None

    # === BEGIN compare placeholder ===
    # Implement comparison logic here. Example:
    # from .compare import compare_faces
    # match, info = compare_faces(registered_bytes, captured_bytes)
    # if match:
    #     attendance.status = 'Present'
    # else:
    #     attendance.status = 'Not Matched'
    # attendance.save()
    # === END compare placeholder ===

    # Return response indicating pending status if compare not implemented
    return JsonResponse({'status': 'success', 'message': 'Attendance recorded (status Pending). Implement compare logic to update status.'})


# Excel download
def download_attendance(request):
    # Query attendance joined with user
    qs = Attendance.objects.select_related('user').order_by('date', 'time')

    wb = Workbook()
    ws = wb.active
    ws.title = "Attendance"

    # Header
    ws.append(['User ID', 'Name', 'Date', 'Time', 'Status'])

    for att in qs:
        uid = att.user.userid if att.user else ''
        name = att.user.name if att.user else ''
        ws.append([uid, name, att.date.strftime('%Y-%m-%d'), att.time.strftime('%H:%M:%S'), att.status])

    # Save workbook to in-memory bytes
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    response = HttpResponse(buffer.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    response['Content-Disposition'] = f'attachment; filename=attendance_{ts}.xlsx'
    return response
