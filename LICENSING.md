# OxideEdit Licensing Guide

**ภาษาไทย / English**

This document explains the OxideEdit AGPLv3-or-later license in plain language.
It is not a replacement for the full license text or legal advice.

## ภาษาไทย

### ก่อน Fork / ก่อนนำไปใช้

OxideEdit เผยแพร่ภายใต้ **GNU Affero General Public License v3.0 or later (AGPLv3-or-later)**

ไฟล์ `LICENSE` คือข้อความ license ฉบับเต็ม และมีผลเหนือคำอธิบายสั้น ๆ ในเอกสารนี้

### AGPLv3 คืออะไร?

**GNU Affero General Public License version 3 (AGPLv3)** เป็น open-source license แบบ strong copyleft

คุณมีสิทธิใช้ ศึกษา แก้ไข และแจกจ่าย OxideEdit ได้ รวมถึงใช้ในเชิงพาณิชย์ได้ ภายใต้เงื่อนไขของ AGPLv3

จุดสำคัญคือ เมื่อมีการแจกจ่าย covered work หรือ binary ของมัน เช่น `.exe`, ผู้แจกต้องปฏิบัติตามข้อกำหนดของ AGPLv3 ซึ่งรวมถึงการจัดให้ผู้รับเข้าถึง **Corresponding Source** ตามรูปแบบที่ license กำหนด

### แจก EXE ได้ไหม?

ได้

AGPLv3 ไม่ได้ห้ามการแจก `.exe` แต่การแจก binary ต้องทำตามเงื่อนไขของ license

ตัวอย่าง:

```
แก้ OxideEdit
    ↓
build เป็น OxideEdit-custom.exe
    ↓
แจกให้คนอื่น
    ↓
ต้องปฏิบัติตาม AGPLv3
    ↓
ต้องจัดให้มี Corresponding Source ตามเงื่อนไขของ license
```

ดังนั้นแนวคิดคือ **แจก binary ได้ แต่แจกแบบละเลยข้อกำหนดเรื่อง source ไม่ได้**

### ถ้าใช้ส่วนตัวล่ะ?

โดยทั่วไป คุณสามารถ fork แก้ไข และใช้งาน private copy ได้โดยไม่ต้องเผยแพร่ private copy เพียงเพราะคุณแก้ไขมัน

### ถ้าเอาไปขายล่ะ?

AGPLv3 ไม่ได้ห้ามการขายซอฟต์แวร์

คุณสามารถจำหน่าย software หรือบริการที่เกี่ยวข้องได้ แต่ต้องปฏิบัติตามเงื่อนไขของ AGPLv3 เมื่อการใช้งานนั้นอยู่ภายใต้ขอบเขตของ license

### Network / Web Service

AGPLv3 เพิ่มข้อกำหนดที่สำคัญสำหรับซอฟต์แวร์ที่ผู้ใช้สามารถโต้ตอบผ่านเครือข่ายได้

หากคุณแก้ไขโปรแกรม AGPL-covered และเปิดให้ผู้ใช้โต้ตอบกับเวอร์ชันที่แก้ไขผ่าน network คุณต้องทำให้ผู้ใช้ที่โต้ตอบจากระยะไกลสามารถเข้าถึง Corresponding Source ของเวอร์ชันนั้นตามเงื่อนไขของ AGPLv3

### สิ่งที่ผู้ Fork ควรรู้

1. **Fork ได้** แต่ fork ไม่ได้เปลี่ยน license ของ covered code ให้เป็น proprietary โดยอัตโนมัติ
2. **แก้ไขได้** และสร้างเวอร์ชันของคุณเองได้ภายใต้ AGPLv3
3. **แจก binary ได้** แต่ต้องปฏิบัติตามข้อกำหนดของ AGPLv3
4. ต้องรักษา copyright notices และ license notices ที่เกี่ยวข้อง
5. ต้องตรวจสอบ license ของ dependencies แยกต่างหาก
6. โค้ดใหม่ของคุณอาจมีสถานะด้าน licensing ของตัวเอง ควรตรวจสอบขอบเขตของงานที่คุณแจกจ่าย

### ตัวอย่าง

**Fork แล้วใช้ส่วนตัว**

สามารถแก้ไขและใช้งาน private copy ได้ โดยทั่วไปไม่จำเป็นต้องเผยแพร่ private copy เพียงเพราะแก้ไข

**Fork แล้วแจก EXE**

สามารถแจกได้ แต่ต้องปฏิบัติตาม AGPLv3 รวมถึงข้อกำหนดเรื่อง Corresponding Source

**Fork แล้วแจกเวอร์ชันที่แก้ไขผ่านเว็บไซต์หรือ network**

นอกจากข้อกำหนดทั่วไปของ AGPLv3 แล้ว ต้องพิจารณาข้อกำหนดเรื่อง remote network interaction ใน Section 13 ของ AGPLv3 ด้วย

## English

### Before Forking / Using OxideEdit

OxideEdit is licensed under the **GNU Affero General Public License v3.0 or later (AGPLv3-or-later)**.

The full license text is in `LICENSE`. The full license controls over this plain-language guide.

### What is AGPLv3?

**GNU Affero General Public License version 3 (AGPLv3)** is a strong copyleft open-source license.

It allows you to use, study, modify, and redistribute OxideEdit, including commercial use, subject to the AGPLv3 terms.

When you distribute a covered work or a binary such as a `.exe`, you must comply with AGPLv3, including its requirements concerning access to the **Corresponding Source**.

### Can I distribute an EXE?

Yes.

AGPLv3 does not ban distribution of `.exe` files. It requires distributors to comply with the license conditions when they convey covered binaries.

For a modified OxideEdit build, that means the distributor must provide the Corresponding Source in a manner permitted by AGPLv3.

### Private use

You can generally modify and use a private copy without publishing that private copy merely because you modified it.

### Commercial use

AGPLv3 does not prohibit charging money for software or services.

Commercial distribution is possible, but the distributor must comply with the AGPLv3 terms that apply to the covered work.

### Network interaction

AGPLv3 includes an additional requirement for modified software that allows users to interact with it remotely through a computer network.

Section 13 requires the modified version to prominently offer those remote users an opportunity to receive the Corresponding Source of that version, subject to the license terms.

### What Forkers Should Know

1. **You may fork the repository** and modify covered code under AGPLv3.
2. **You may build and distribute binaries**, but you must satisfy AGPLv3's distribution requirements.
3. Required copyright and license notices must be preserved.
4. Dependencies may have separate licenses and should be reviewed individually.
5. New code you add may have its own licensing terms, so review the boundary between your changes and AGPL-covered code.

### Simple Examples

**Fork and use privately**

You can generally modify and use the private copy without publishing it merely because you modified it.

**Fork and distribute a custom EXE**

You may distribute the EXE, but you must comply with AGPLv3, including the applicable Corresponding Source requirements.

**Run a modified network service**

Pay particular attention to Section 13 and the source-availability requirement for users who interact with the modified program remotely.

## Full License Text

- [`LICENSE`](LICENSE) - GNU AGPLv3-or-later

SPDX expression:

    AGPL-3.0-or-later

> This document is a plain-language guide, not legal advice. Review the full license text for production or commercial distribution.
