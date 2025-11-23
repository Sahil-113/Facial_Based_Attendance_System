"""
Compare placeholder module.

Implement your OpenCV LBPH or other compare logic here.

Function signature must accept two image-bytes and return (match_bool, info_dict).
"""
def compare_faces(registered_image_bytes: bytes, captured_image_bytes: bytes):
    """
    Placeholder. Implement and return:
        (True, {'confidence': 45.0})  -> if match
        (False, {'confidence': 95.3}) -> if not match

    registered_image_bytes and captured_image_bytes are raw file bytes (jpg/png).
    """
    raise NotImplementedError("compare_faces is a placeholder. Implement LBPH/OpenCV logic here.")
