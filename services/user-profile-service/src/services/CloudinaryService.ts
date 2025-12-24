import { cloudinary } from "../config/Cloudinary";

export class CloudinaryService {
  private folder = "cinemas_avatar"; // folder bạn đã setup sẵn trong preset

  /**
   * Lấy public URL từ publicId (nếu cần)
   */
  getPublicUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }

  /**
   * Xóa file theo publicId (ví dụ: avatars/user123)
   */
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Xóa file từ secure_url mà FE gửi về
   */
  async deleteFileByUrl(avatarUrl: string): Promise<void> {
    if (avatarUrl && !avatarUrl.includes("default_avt.jpg")) {
      // secure_url dạng: https://res.cloudinary.com/<cloud_name>/image/upload/v123456789/avatars/abc123.jpg
      const parts = avatarUrl.split("/");
      const fileName = parts[parts.length - 1].split(".")[0]; // abc123
      const publicId = `${this.folder}/${fileName}`;
      await this.deleteFile(publicId);
    }
  }
}
